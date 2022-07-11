package main

import (
	"encoding/json"
	"errors"
	"bytes"
	"fmt"
	"github.com/golang/protobuf/ptypes"
	"github.com/golang/protobuf/ptypes/timestamp"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
	"strconv"
	//"time"
)

// users can transfer token
// @param APIstub
// @param args The arguments array containing senderAccountNumber, amount, receiverAccountNumber and description
// @param 'User' model, that is the requestSender
// @return A response structure indicating success or failure with a message
// senderAccountNumber := args[0]
// amountStr := args[1]
// receiverAccountNumber := args[2]
// description := args[3]

func (s *SmartContract) transfer(APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments, expecting 4")
	}

	senderAccountNumber := args[0]
	amountStr := args[1]
	receiverAccountNumber := args[2]
	description := args[3]


	// Checking receiver account existence
	receiver, err := getUser(APIstub, receiverAccountNumber)
	if err != nil || receiver == (User{}) {
		return shim.Error("Receiver account doesn't exist.")
	}

	// Check user access by checking the certificate
	if senderAccountNumber != requestSender.AccountNumber{
		return shim.Error("user access to other accounts denied")
	}

	// this feature must discussed that is necessary or not
	//if requestSender.Type == AdminOrg1 {
	//	if requestSender.AccountNumber == EjSupervisorExpiredEjsAccountNumber && receiver.Type != EXCHANGE {
	//		return shim.Error("cannot transfer to non Exchange accounts")
	//	}
	//}

	// Check the amount is a uint
	amountUint, convertErr := strconv.ParseUint(amountStr, 10, 64)
	if convertErr != nil {
		return shim.Error("Provided value was not an unsigned integer.")
	}

	// Calculating fee for both sender and receiver
	//senderFee, receiverFee := getFee(receiver.Type, amountUint)

	senderBalance := requestSender.Balance

	// Prune the deltas belonging to sender (that has been sent to the sender)
	pruneResp, deltaSum := transferPrune(APIstub, &requestSender, true)
	if pruneResp.Status == ERROR {
		return shim.Error(fmt.Sprintf("Could not transferPrune sender account deltas. \nError: %s", pruneResp.Message))
	}


	// Check the sender balance is sufficient
	senderBalance += deltaSum
	if (amountUint) > senderBalance {
		return shim.Error(fmt.Sprintf("Insufficient funds. amount to send: %d, sender balance: %d",
			amountUint,
			senderBalance))

	}

	// Subtracting amount to be sent from sender's balance
	requestSender.Balance = senderBalance-amountUint
	requestSender.RecentFunction = "transfer"
	requestSenderAsBytes, marshalErr := json.Marshal(requestSender)
	putErr := APIstub.PutState(senderAccountNumber, requestSenderAsBytes)
	if putErr != nil || marshalErr != nil {
		return shim.Error(fmt.Sprintf("Failed to put state: %s", putErr.Error()))
	}

	// Creating the delta for the receiver
	createDeltaResponse := createTransferDelta(APIstub, receiverAccountNumber, amountUint)
	if createDeltaResponse.Status == ERROR {
		// returning the sent amount to the sender
		requestSender.Balance = senderBalance
		requestSenderAsBytes, marshalErr := json.Marshal(requestSender)
		putErr = APIstub.PutState(senderAccountNumber, requestSenderAsBytes)
		if putErr != nil || marshalErr != nil {
			return shim.Error(fmt.Sprintf("Failed to put updated state: %s", putErr.Error()))
		}

		return shim.Error("Could not create transfer delta for the receiver, transfer rejected.")
	}

	// Put this transaction in history
	objectType := TransactionObjectType
	txid := APIstub.GetTxID()
	ts, tsErr := APIstub.GetTxTimestamp()
	if tsErr != nil {
		return shim.Error(tsErr.Error())
	}
	transTime, timeError := ptypes.Timestamp((*timestamp.Timestamp)(ts))
	if timeError != nil {
		return shim.Error(timeError.Error())
	}
	transaction := &TransactionHistory{ObjectType: objectType, TransactionID: txid,
		Sender: senderAccountNumber, Receiver: receiverAccountNumber,
		Value: amountUint,
		Description: description,  Timestamp: transTime}

	transactionJSONasBytes, err := json.Marshal(transaction)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = APIstub.PutState(txid, transactionJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(transactionJSONasBytes)
}

// @param APIstub
// @param args The arguments array containing accountNumber
// @return A response structure indicating success or failure with a message and payload
// accountNumber := args[0]
func (s *SmartContract) getBalance(APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments, expecting 1")
	}

	accountNumber := args[0]

	// check whether the invoker is admin
	// or if user, check whether she has the access
	if requestSender.AccountNumber != accountNumber && requestSender.Type != AdminOrg1 {
		return shim.Error("user not authorized")
	}

	var finalVal uint64 = 0
	var requestedUser User

	if requestSender.Type == ENDUSER || requestSender.Type == SOURCE || requestSender.Type == SUPPLIER {
		requestedUser = requestSender
	}else {
		var getErr error
		requestedUser, getErr = getUser(APIstub, accountNumber)
		if getErr != nil {
			return shim.Error(getErr.Error())
		}
	}

	finalVal = requestedUser.Balance + finalVal

	// Then we aggregate the not pruned deltas belonging (sent) to the accountNumber
	// we do not delete the deltas, we just add up their amounts
	pruneResp, deltaSum := transferPrune(APIstub, &requestedUser, false)
	if pruneResp.Status == ERROR {
		return shim.Error(fmt.Sprintf(
			"Could not transferPrune account deltas, cannot calculate the balance. Try again. Error: %s",
			pruneResp.Message))
	}

	finalVal += deltaSum

	return shim.Success([]byte(strconv.FormatUint(finalVal, 10)))
}



// This function gets the transaction history for one specific user when value is changed
// @param APIstub
// @param args The arguments array containing AccountNumber
// @param 'User' model, that is the requestSender
// @return A response promise
// accountNumber := args[0]

func (s *SmartContract) getTransactionHistoryForUser1(APIstub shim.ChaincodeStubInterface,requestSender User, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	accountNumber := args[0]

	// check whether the invoker is admin
	// or if user, check whether she has the access
	if requestSender.AccountNumber != accountNumber && requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2 {
		return shim.Error("user not authorized")
	}

	iterator, err := APIstub.GetHistoryForKey(accountNumber)
	if err != nil {
	  return shim.Error(err.Error())
	}
	defer iterator.Close()
  
  
	var buffer bytes.Buffer
	buffer.WriteString("[")
  
	flag := false
	for iterator.HasNext() {
	  queryResponse, err := iterator.Next()
	  if err != nil {
		return shim.Error(err.Error())
	  }
  
	  if flag == true {
		buffer.WriteString(",")
	  }
  
	  // constructing JSOn files key/value pairs
	  buffer.WriteString("{\"TxId\":")
	  buffer.WriteString("\"")
	  buffer.WriteString(string(queryResponse.TxId))
	  buffer.WriteString("\"")
  
	  buffer.WriteString(", \"Value\":")
	  buffer.WriteString(string(queryResponse.Value))
	  buffer.WriteString(", \"Timestamp\":")
	  buffer.WriteString(strconv.FormatInt(queryResponse.Timestamp.Seconds,10))
	  buffer.WriteString("}")
	  flag = true
	}
	buffer.WriteString("]")
  
	//for debug purposes
	fmt.Printf("- queryAllAsset:\n%s\n", buffer.String())
  
	return shim.Success(buffer.Bytes())

}

// This function gets the transaction history for one specific user when composite key is changed
// @param APIstub
// @param args The arguments array containing AccountNumber
// @param 'User' model, that is the requestSender
// @return A response promise
// accountNumber := args[0]

func (s *SmartContract) getTransactionHistoryForUser2(APIstub shim.ChaincodeStubInterface,requestSender User, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	accountNumber := args[0]

	// check whether the invoker is admin
	// or if user, check whether she has the access
	if requestSender.AccountNumber != accountNumber && requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2 {
		return shim.Error("user not authorized")
	}
	// Get all delta rows for the variable
	deltaResultsIterator, deltaErr := APIstub.GetStateByPartialCompositeKey(
		TransferDeltaIndexName, []string{requestSender.AccountNumber})

	if deltaErr != nil {
		return shim.Error(fmt.Sprintf(
			"Could not retrieve delta iterator for account %s: %s", requestSender.AccountNumber, deltaErr.Error()))
	}

	//noinspection GoUnhandledErrorResult
	defer deltaResultsIterator.Close()

	// Check the variable existed
	if !deltaResultsIterator.HasNext() {
		return shim.Success([]byte(fmt.Sprintf(
			"No delta for the account number %s exists. Pruning not needed.", requestSender.AccountNumber)))
	}

	// Iterate through result set computing final value while iterating and deleting each key
	var buffer bytes.Buffer
	buffer.WriteString("[")
  
	flag := false
	txid := ""
	// amount:= ""
	for deltaResultsIterator.HasNext(){
		// Get the next row
		responseRange, nextErr := deltaResultsIterator.Next()
		if nextErr != nil {
			return shim.Error(nextErr.Error())
		}

		// Split the key into its composite parts
		_, keyParts, splitKeyErr := APIstub.SplitCompositeKey(responseRange.Key)
		if splitKeyErr != nil {
			return shim.Error(splitKeyErr.Error())
		}

		// Retrieve the amount
		txid = keyParts[2]
		// amount = keyParts[1]
		if flag == true {
			buffer.WriteString(",")
		}
	  
		  // constructing JSOn files key/value pairs
		  buffer.WriteString("{\"TxId\":")
		  buffer.WriteString("\"")
		  buffer.WriteString(txid)
		  buffer.WriteString("\"")
		  buffer.WriteString("}")
		  flag = true
		}
		buffer.WriteString("]")
	  
		//for debug purposes
		fmt.Printf("- queryfordeltatransactions:\n%s\n", buffer.String())
	  
		return shim.Success(buffer.Bytes())
}

// ===========================================================================================================
//=============================================== The following functions are the 
// Each user should know his/her txs as a sender
// the following finction gives back the result of txs that belong to some user as sender
// @param APIstub
// @param args The arguments array containing accountNumber
// @return A response string
// 	accountnumber := args[0]
func (s *SmartContract) getUserTxsAsSender (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	if args[0] != requestSender.AccountNumber && requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2{
		return shim.Error("You do not have access to see the assets!")
	}

	// User as Sender
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"transaction\",\"sender\":\"%s\"}}", args[0])

			iterator, err := APIstub.GetQueryResult(queryString)
			if err != nil {
				return shim.Error(fmt.Sprintf("state operation failed. Error accessing state: %s", err))
			}
			defer iterator.Close()
		
			if err != nil {
				return shim.Error(err.Error())
			  }
			  defer iterator.Close()
			
			
			  var buffer bytes.Buffer
			  buffer.WriteString("[")
			
			  flag := false
			  for iterator.HasNext() {
				queryResponse, err := iterator.Next()
				if err != nil {
				  return shim.Error(err.Error())
				}
			
				if flag == true {
				  buffer.WriteString(",")
				}
			
				// constructing JSOn files key/value pairs
				buffer.WriteString("{\"Key\":")
				buffer.WriteString("\"")
				buffer.WriteString(queryResponse.Key)
				buffer.WriteString("\"")
			
				buffer.WriteString(", \"Value\":")
				buffer.WriteString(string(queryResponse.Value))
				buffer.WriteString("}")
				//buffer.WriteString(strconv.FormatInt(queryResponse.Timestamp.Seconds,10))
				//buffer.WriteString("}")
				flag = true
			  }
	
			  buffer.WriteString("]")
			
			  //for debug purposes
			  fmt.Printf("- queryAllTxforuserAsSender:\n%s\n", buffer.String())
			
			  return shim.Success(buffer.Bytes())
}



// Each user should know his/her txs as a receiver
// the following finction gives back the result of txs that belong to some user as receiver
// @param APIstub
// @param args The arguments array containing accountNumber
// @return A response string
// 	accountnumber := args[0]
func (s *SmartContract) getUserTxsAsReceiver (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	if args[0] != requestSender.AccountNumber && requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2{
		return shim.Error("You do not have access to see the assets!")
	}

	// User as Sender
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"transaction\",\"receiver\":\"%s\"}}", args[0])

			iterator, err := APIstub.GetQueryResult(queryString)
			if err != nil {
				return shim.Error(fmt.Sprintf("state operation failed. Error accessing state: %s", err))
			}
			defer iterator.Close()
		
			if err != nil {
				return shim.Error(err.Error())
			  }
			  defer iterator.Close()
			
			
			  var buffer bytes.Buffer
			  buffer.WriteString("[")
			
			  flag := false
			  for iterator.HasNext() {
				queryResponse, err := iterator.Next()
				if err != nil {
				  return shim.Error(err.Error())
				}
			
				if flag == true {
				  buffer.WriteString(",")
				}
			
				// constructing JSOn files key/value pairs
				buffer.WriteString("{\"Key\":")
				buffer.WriteString("\"")
				buffer.WriteString(queryResponse.Key)
				buffer.WriteString("\"")
			
				buffer.WriteString(", \"Value\":")
				buffer.WriteString(string(queryResponse.Value))
				buffer.WriteString("}")
				//buffer.WriteString(strconv.FormatInt(queryResponse.Timestamp.Seconds,10))
				//buffer.WriteString("}")
				flag = true
			  }
	
			  buffer.WriteString("]")
			
			  //for debug purposes
			  fmt.Printf("- queryAllTxforuserAsReceiver:\n%s\n", buffer.String())
			
			  return shim.Success(buffer.Bytes())
}

// Each user should know all his/her txs 
// the following finction gives back the result of txs that belong to some user 
// @param APIstub
// @param args The arguments array containing accountNumber
// @return A response string
// 	accountnumber := args[0]
func (s *SmartContract) getUserTxs (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	if args[0] != requestSender.AccountNumber && requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2{
		return shim.Error("You do not have access to see the assets!")
	}

	// User as Sender
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"transaction\",\"$or\":[{\"sender\":\"%s\"},{\"receiver\":\"%s\"}]}}", args[0],args[0])

			iterator, err := APIstub.GetQueryResult(queryString)
			if err != nil {
				return shim.Error(fmt.Sprintf("state operation failed. Error accessing state: %s", err))
			}
			defer iterator.Close()
		
			if err != nil {
				return shim.Error(err.Error())
			  }
			  defer iterator.Close()
			
			
			  var buffer bytes.Buffer
			  buffer.WriteString("[")
			
			  flag := false
			  for iterator.HasNext() {
				queryResponse, err := iterator.Next()
				if err != nil {
				  return shim.Error(err.Error())
				}
			
				if flag == true {
				  buffer.WriteString(",")
				}
			
				// constructing JSOn files key/value pairs
				buffer.WriteString("{\"Key\":")
				buffer.WriteString("\"")
				buffer.WriteString(queryResponse.Key)
				buffer.WriteString("\"")
			
				buffer.WriteString(", \"Value\":")
				buffer.WriteString(string(queryResponse.Value))
				buffer.WriteString("}")
				//buffer.WriteString(strconv.FormatInt(queryResponse.Timestamp.Seconds,10))
				//buffer.WriteString("}")
				flag = true
			  }
	
			  buffer.WriteString("]")
			
			  //for debug purposes
			  fmt.Printf("- queryAllTxforuserAsReceiver:\n%s\n", buffer.String())
			
			  return shim.Success(buffer.Bytes())
}



// This function gets all the users
// @param APIstub
// @param args The arguments array containing startkey, endkey
// @param 'User' model, that is the requestSender
// @return A response promise
//	startKey := args[0]
//  endKey := args[1]

func (s *SmartContract) getAllUsers (APIstub shim.ChaincodeStubInterface, requestSender User,  args []string) peer.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	startKey := args[0]
	endKey := args[1]

	iterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(fmt.Sprintf("keys operation failed. Error accessing state: %s", err))
	}
	defer iterator.Close()
	if err != nil {
		return shim.Error(err.Error())
	  }
	  defer iterator.Close()
	
	
	  var buffer bytes.Buffer
	  buffer.WriteString("[")
	
	  flag := false
	  for iterator.HasNext() {
		queryResponse, err := iterator.Next()
		if err != nil {
		  return shim.Error(err.Error())
		}
	
		if flag == true {
		  buffer.WriteString(",")
		}
	
		// constructing JSOn files key/value pairs
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(string(queryResponse.Key))
		buffer.WriteString("\"")
	
		buffer.WriteString(", \"Value\":")
		buffer.WriteString(string(queryResponse.Value))
		//buffer.WriteString(", \"Timestamp\":")
		//buffer.WriteString(strconv.FormatInt(queryResponse.Timestamp.Seconds,10))
		buffer.WriteString("}")
		flag = true
	  }
	  buffer.WriteString("]")
	
	  //for debug purposes
	  fmt.Printf("- queryAllAsset:\n%s\n", buffer.String())
	
	  return shim.Success(buffer.Bytes())

}

// Creates a new delta for a particular accountNumber. Deltas are actually transactions
// that are not still added to the accountNumber main balance but are aggregated
// when getting the balance or pruned transferring funds
//
//	-  receiverAccountNumber
//	-  amountStr
//
// @param APIstub The chaincode shim
//
// @return A response structure indicating success or failure with a message
func  createTransferDelta(APIstub shim.ChaincodeStubInterface, receiverAccountNumber string, amount uint64) peer.Response {

	if amount == 0 {
		return shim.Error("The amount cannot be zero.")
	}

	amountStr := strconv.FormatUint(amount,10)

	// Retrieve info needed for the create delta procedure
	txid := APIstub.GetTxID()

	compositeIndexName := TransferDeltaIndexName //"receiverAccountNumber~amountStr~txID"

	// Create the composite key that will allow us to query for all deltas on a particular variable
	compositeKey, compositeErr := APIstub.CreateCompositeKey(compositeIndexName,
		[]string{receiverAccountNumber, amountStr, txid})

	if compositeErr != nil {
		return shim.Error(fmt.Sprintf(
			"Could not create a composite key for %s: %s", receiverAccountNumber, compositeErr.Error()))
	}

	// Save the composite key index
	compositePutErr := APIstub.PutState(compositeKey, []byte{0x00})
	if compositePutErr != nil {
		return shim.Error(fmt.Sprintf(
			"Could not put operation for %s in the ledger: %s", receiverAccountNumber, compositePutErr.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully added %s to %s", amountStr, receiverAccountNumber)))
}

// Aggregates all deltas of an accountNumber and returns their sum, can delete
// all deltas if deleteFlag is true
//
// The args array contains the following argument:
//	- usr ( the 'user' that we want to aggregate all the deltas )
//
// @param APIstub The chaincode shim
// @param accountNumber
// @param deleteFlag boolean value, if true also deletes the deltas
//
// @return A response structure indicating success or failure with a message
func transferPrune(APIstub shim.ChaincodeStubInterface, usr *User, deleteFlag bool) (peer.Response, uint64) {

	// Get all delta rows for the variable
	deltaResultsIterator, deltaErr := APIstub.GetStateByPartialCompositeKey(
		TransferDeltaIndexName, []string{usr.AccountNumber})

	if deltaErr != nil {
		return shim.Error(fmt.Sprintf(
			"Could not retrieve delta iterator for account %s: %s", usr.AccountNumber, deltaErr.Error())), 0
	}

	//noinspection GoUnhandledErrorResult
	defer deltaResultsIterator.Close()

	// Check the variable existed
	if !deltaResultsIterator.HasNext() {
		return shim.Success([]byte(fmt.Sprintf(
			"No delta for the account number %s exists. Pruning not needed.", usr.AccountNumber))), 0
	}

	// Iterate through result set computing final value while iterating and deleting each key
	var finalVal uint64
	var i int
	for i = 0; deltaResultsIterator.HasNext(); i++ {
		// Get the next row
		responseRange, nextErr := deltaResultsIterator.Next()
		if nextErr != nil {
			return shim.Error(nextErr.Error()), finalVal
		}

		// Split the key into its composite parts
		_, keyParts, splitKeyErr := APIstub.SplitCompositeKey(responseRange.Key)
		if splitKeyErr != nil {
			return shim.Error(splitKeyErr.Error()), finalVal
		}

		// Retrieve the amount
		amountStr := keyParts[1]

		// Convert the amount to a uint
		amountUint, convErr := strconv.ParseUint(amountStr, 10, 64)
		if convErr != nil {
			return shim.Error(convErr.Error()), finalVal
		}

		// Delete the row from the ledger
		if deleteFlag {
			deltaRowDelErr := APIstub.DelState(responseRange.Key)
			if deltaRowDelErr != nil {
				return shim.Error(fmt.Sprintf(
					"Could not delete delta row: %s", deltaRowDelErr.Error())), finalVal
			}
		}

		// Add the value of the deleted row to the final aggregate
		finalVal += amountUint
	}

	// Update the ledger with the final value and return
	if deleteFlag {
		usr.Balance += finalVal
		usrAsBytes, err := json.Marshal(usr)
		putErr := APIstub.PutState(usr.AccountNumber, usrAsBytes)
		if err != nil || putErr != nil{
			return shim.Error(fmt.Sprintf(
				"Failed to transferPrune variable: all rows deleted but could not update value to %d," +
					" variable no longer exists in ledger", finalVal + usr.Balance)), finalVal
		}
	}

	return shim.Success([]byte(fmt.Sprintf(
		"Successfully pruned account %s, final value is %d, %d rows pruned. deleteFlag: %t",
		usr.AccountNumber, finalVal, i, true))), finalVal
}


// This function is for the admins to issue money for users
// @param APIstub
// @param args The arguments array containing senderAccountNumber, amount, receiverAccountNumber 
// @param 'User' model, that is the requestSender
// @return A response structure indicating success or failure with a message
// receiverAccountNumber := args[0]
// amountStr := args[1]

func (s *SmartContract) issueForUser(APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {
   
   
	if requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2 {
		return shim.Error("access denied")
	}

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments, expecting 2")
	}

	receiver := args[0]
	amount := args[1]
	
	r, err2 := getUser(APIstub, receiver)
	if err2 != nil || r == (User{}) {
		return shim.Error("Receiver account doesn't exist.")
	}

	amountUint, err := strconv.ParseUint(amount, 10, 64)

	if err != nil {
		return shim.Error(err.Error())
	}

	err = withdrawFromBank(APIstub, amountUint)

	if err != nil {
		return shim.Error(err.Error())
	}

	deltaResponse := createTransferDelta(APIstub, receiver, amountUint)

	return deltaResponse
}

// This function is for withdrawing money from the bank
// @param APIstub
// @param amount
// @return A response structure indicating success or failure with a message

func withdrawFromBank(APIstub shim.ChaincodeStubInterface, amount uint64) error {

	bankSavingStr, err := APIstub.GetState(EJBankKey)

	if err != nil {
		return err
	}

	bankSaving, err := strconv.ParseUint(string(bankSavingStr), 10, 64)

	if err != nil {
		return err
	}

	if bankSaving - amount < 0 {
		return errors.New("insufficient savings")
	}

	err = APIstub.PutState(EJBankKey,  []byte(fmt.Sprint(bankSaving-amount)))

	if err != nil {
		return err
	}

	return nil
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The following functions are not used in the current chaincode

func getQueryResultForQueryString(APIstub shim.ChaincodeStubInterface, queryString string) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, err := APIstub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	//noinspection GoUnhandledErrorResult
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", buffer.String())

	return buffer.Bytes(), nil
}

// users can get their own transaction history
// @param APIstub
// @param args
// - args[0] -> accountNumber
// - args[1] -> pageNumberStr
// - args[2] -> limitStr
//
// @return A response structure including success or failure with a message
// accountNumber := args[0]
// pageNumberStr := args[1]
// limitStr := args[2]

func (s *SmartContract) getTransactionHistoryForUser_old(APIstub shim.ChaincodeStubInterface,requestSender User, args []string) peer.Response {

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	accountNumber := args[0]
	pageNumberStr := args[1]
	limitStr := args[2]

	// check whether the invoker is admin
	// or if user, check whether she has the access
	if requestSender.AccountNumber != accountNumber && requestSender.Type != AdminOrg1 {
		return shim.Error("user not authorized")
	}

	pageNumberInt, convErrPageNumber := strconv.ParseUint(pageNumberStr, 10, 64)

	if convErrPageNumber != nil {
		return shim.Error(fmt.Sprintf("Provided pageNumber was not an unsigned integer number: %s",
			convErrPageNumber.Error()))
	}

	limitInt, convErrLimit := strconv.ParseUint(limitStr, 10, 64)

	if convErrLimit != nil{
		return shim.Error(fmt.Sprintf(
			"Provided limit was not an unsigned integer number: %s", convErrLimit.Error()))
	}

	skip := (pageNumberInt - 1) * limitInt

	queryString := fmt.Sprintf(
		"{\"selector\":" +
			"{\"docType\":\"transaction\"," +
			"\"$or\":[{ \"sender\":\"%s\"},{ \"receiver\":\"%s\"}]" +
			"}," +
			"\"fields\":[\"sender\", \"receiver\" , \"value\", \"description\", \"timestamp\"]," +
			" \"sort\":[{\"timestamp\":\"desc\"}]," +
			"\"limit\":\"%s\"," +
			"\"skip\":\"%d\"" +
			"}",
		accountNumber, accountNumber, limitStr, skip)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

// Admin can get all transactions history
// @param APIstub
// @param args
// - args[1] -> pageNumberStr
// - args[2] -> limitStr
//
// @return A response structure including success or failure with a message

func (s *SmartContract) getTransactionHistory_old(APIstub shim.ChaincodeStubInterface, requestSender User,  args []string) peer.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pageNumberStr := args[0]
	limitStr := args[1]

	// check whether the invoker is admin
	// or if user, check whether she has the access
	if requestSender.Type != AdminOrg1 {
		return shim.Error("user not authorized")
	}

	pageNumberInt, convErrPageNumber := strconv.ParseUint(pageNumberStr, 10, 64)

	if convErrPageNumber != nil {
		return shim.Error(fmt.Sprintf("Provided pageNumber was not an unsigned integer number: %s",
			convErrPageNumber.Error()))
	}

	limitInt, convErrLimit := strconv.ParseUint(limitStr, 10, 64)

	if convErrLimit != nil{
		return shim.Error(fmt.Sprintf(
			"Provided limit was not an unsigned integer number: %s", convErrLimit.Error()))
	}

	skip := (pageNumberInt - 1) * limitInt

	queryString := fmt.Sprintf(
		"{\"selector\":" +
			"{\"docType\":\"transaction\" }," +
			"\"fields\":[\"sender\", \"receiver\" , \"value\", \"description\", \"timestamp\"]," +
			" \"sort\":[{\"timestamp\":\"desc\"}]," +
			"\"limit\":\"%s\"," +
			"\"skip\":\"%d\"" +
			"}",
		limitStr, skip)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

func (s *SmartContract) batchTransfer(APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) < 4 {
		return shim.Error("Incorrect number of arguments, expecting 4")
	}

	senderAccountNumber := args[0]
	description := args[1]

	// Check user access by checking the certificate
	if senderAccountNumber != requestSender.AccountNumber{
		return shim.Error("user access to other accounts denied")
	}

	senderBalance := requestSender.Balance

	// Prune the deltas belonging to sender (that has been sent to the sender)
	pruneResp, deltaSum := transferPrune(APIstub, &requestSender, true)
	if pruneResp.Status == ERROR {
		return shim.Error(fmt.Sprintf("Could not transferPrune sender account deltas. \nError: %s", pruneResp.Message))
	}

	// Check the sender balance is sufficient
	senderBalance += deltaSum

	batchSize := (len(args) - 2)/2

	histories := make([]TransactionHistory, batchSize)
	txid := APIstub.GetTxID()

	for i := 0; i < batchSize; i++ {

		receiverAccountNumber := args[2*i+2]
		amountStr := args[2*i+3]

		receiver, err := getUser(APIstub, receiverAccountNumber)
		if err != nil || receiver == (User{}) {
			return shim.Error("Receiver account doesn't exist.")
		}
        /*
		if requestSender.Type == AdminOrg1 {
			if requestSender.AccountNumber == EjSupervisorExpiredEjsAccountNumber && receiver.Type != EXCHANGE {
				return shim.Error("cannot transfer to non Exchange accounts")
			}
		}
       */
		// Check the amount is a uint
		amountUint, convertErr := strconv.ParseUint(amountStr, 10, 64)
		if convertErr != nil {
			return shim.Error("Provided value was not an unsigned integer.")
		}

		// Calculating fee for both sender and receiver
		//senderFee, receiverFee := getFee(receiver.Type, amountUint)

		if (amountUint) > senderBalance {
			return shim.Error(fmt.Sprintf("Insufficient funds. amount to send: %d, sender balance: %d",
				amountUint,
				senderBalance))

		}

		// Subtracting amount to be sent from sender's balance
		senderBalance = senderBalance-amountUint


		// Creating the delta for the receiver
		createDeltaResponse := createTransferDelta(APIstub, receiverAccountNumber, amountUint)
		if createDeltaResponse.Status == ERROR {
			return shim.Error("Could not create transfer delta for the receiver, transfer rejected.")
		}


		// Put this transaction in history
		objectType := TransactionObjectType

		ts, tsErr := APIstub.GetTxTimestamp()
		if tsErr != nil {
			return shim.Error(tsErr.Error())
		}
		transTime, timeError := ptypes.Timestamp((*timestamp.Timestamp)(ts))
		if timeError != nil {
			return shim.Error(timeError.Error())
		}
		transaction := TransactionHistory{ObjectType: objectType, TransactionID: txid,
			Sender: senderAccountNumber, Receiver: receiverAccountNumber,
			Value: amountUint, Description: description,  Timestamp: transTime}

		histories[i] = transaction

	}


	requestSender.Balance = senderBalance
	requestSenderAsBytes, marshalErr := json.Marshal(requestSender)
	putErr := APIstub.PutState(senderAccountNumber, requestSenderAsBytes)
	if putErr != nil || marshalErr != nil {
		return shim.Error(fmt.Sprintf("Failed to put state: %s", putErr.Error()))
	}

	transactionJSONasBytes, err := json.Marshal(histories)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = APIstub.PutState(txid, transactionJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(transactionJSONasBytes)

}



