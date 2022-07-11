package main

import (

	"encoding/json"
	"fmt"
	"strconv"
	//"time"
	"bytes"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

//this function is a test function that returns the Type of the user who sent the TX
// @Param APIstub
// @Param args, the argument array containing senderAccountNumber
// @return A response message indicating the Type of the sender as SUPPLIER, SOURCE, etc

func (s *SmartContract) who (APIstub shim.ChaincodeStubInterface, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments, expecting 1")
	}

	senderAccountNumber := args[0]

	// Checking sender account existence
	sender, err := getUser(APIstub, senderAccountNumber)
	if err != nil || sender == (User{}) {
		return shim.Error("Sender account doesn't exist.")
	}

	return shim.Success([]byte(fmt.Sprintf(("{"+"\"Type\":\"%s\""+"}"),sender.Type)))
}

//this function is a test function returns the current holder and location of a micro
// @Param APIstub
// @Param args, the argument array containing assetSerialNumber
// @return A response message indicating the Type of the sender as SUPPLIER, SOURCE, etc

func (s *SmartContract) what (APIstub shim.ChaincodeStubInterface, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments, expecting 1")
	}

	assetSerialNumber := args[0]

	// Checking sender account existence
	asset, err := getAsset(APIstub, assetSerialNumber)
	if err != nil || asset == (Asset{}) {
		return shim.Error("Asset account doesn't exist.")
	}

	return shim.Success([]byte(fmt.Sprintf(("{"+"\"RecentFunction\":\"%s\"," +"\"Holder\":\"%s\"," + "\"Location\":\"%s\","+"\"Temperature\":\"%s\","+"\"Variable\":\"%s\""+"}"),asset.RecentFunction,asset.Holder,asset.Location,asset.Temperature,asset.Variable)))
}

//this function is used for testing the chainCode
// @Param APIstub
// @Param args, the argument array containing senderAccountNumber and a value
// @return A response structure indicating success or failure with a message

func (s *SmartContract) test(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments, expecting 2")
	}

	senderAccountNumber := args[0]
	valueStr := args[1]

	// Checking sender account existence
	sender, err := getUser(APIstub, senderAccountNumber)
	if err != nil || sender == (User{}) {
		return shim.Error("Sender account doesn't exist.")
	}

	return shim.Success([]byte(fmt.Sprintf("Attribute value is: %s \n requestSender is: %s", valueStr , senderAccountNumber)))
}


// This function only allows SOURCES to add their asset on the ledger!
// @param APIstub
// @return A response structure indicating success or failure with a message
// @param args
// What are the inputs?
// ObjectType == AssetObjectType
// arg[0] = SerialNumber
// arg[1] = AssetType
// arg[2] = AssetVar
/// Status == false
// should seperate this function to two, registerAsset and confirmAsset, register called by Admins and confirm called by source
func (s *SmartContract) confirmAsset(APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {


	if requestSender.Type != SOURCE {  // Org1 must
		return shim.Error("Only sources can add asset to the ledger!")
	}
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments, expecting 3")
	}

	serialNumber := args[0]
	assetType := args[1]
	assetVar := args[2]

	asset, err := getAsset(APIstub, serialNumber)

	if err != nil || asset == (Asset{}) {
		return shim.Error("Asset doesn't exist.")
	}
	if asset.Status == true {
		return shim.Error("Asset can not be confirmed, it's already confirmed and even reaches to the destination.")
	}


	if requestSender.AccountNumber != asset.Holder {
		return shim.Error("Only holder can add asset to the ledger!")
	}


	asset.AssetType = assetType
	asset.Variable = assetVar
	asset.RecentFunction = "UserSetType"
	asset.ObjectType  = AssetObjectType

	assetJsonAsBytes, err := json.Marshal(asset)
	if err!= nil {
		return shim.Error(err.Error())
	}
	err = APIstub.PutState(serialNumber, assetJsonAsBytes)

	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to confirming asset in chaincode %s, %s",serialNumber, err.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully confirmed asset in chaincode, Serial. No.: %s", serialNumber)))

}



// This function only allows Assets to change the properties on the ledger!
// @param APIstub
// @return A response structure indicating success or failure with a message
// @param args
// What are the inputs?
// arg[0] = new_location
// arg[1] = new_Temp
// arg[2] = new_variable
func (s *SmartContract) changeProperties (APIstub shim.ChaincodeStubInterface, requestAsset Asset, args []string) peer.Response {

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments, expecting 3")
	}

	requestAsset.Location = args[0]
	requestAsset.RecentFunction = "ChangeProperties"

	//assetTemperetaure, convErrAssetTemp := strconv.ParseUint(args[1], 10, 64)

	//if convErrAssetTemp != nil {
	//	return shim.Error(fmt.Sprintf("Provided Tempretuare was not a number: %s",
	//		convErrAssetTemp.Error()))
	//}

	requestAsset.Temperature = args[1]
	requestAsset.Humidity = args[2]


	assetJsonAsBytes, err := json.Marshal(requestAsset)
	if err!= nil {
		return shim.Error(err.Error())
	}
	err = APIstub.PutState(requestAsset.SerialNumber, assetJsonAsBytes)

	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change properties of asset with serial number %s, %s",requestAsset.SerialNumber, err.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully changed the properties of asset, Serial. No.: %s", requestAsset.SerialNumber)))
}

// This function only allows the holder of an asset to change the holder,
// @param APIstub
// @return A response structure indicating success or failure with a message
// @param args
// What are the inputs?
//arg[0] = serial number
//arg[1] = new_holder (account #)
func (s *SmartContract) changeHolder (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments, expecting 2")
	}

	serialNumber := args[0]
	newHolder := args[1]

	asset, err := getAsset(APIstub, serialNumber)

	if err != nil || asset == (Asset{}) {
		return shim.Error("Asset doesn't exist.")
	}
	if asset.Status == true {
		return shim.Error("Asset can not be transferred. It has already reached the destination.")
	}

	if requestSender.AccountNumber != asset.Holder {
		return shim.Error("Only holder can change asset holder !")
	}

	receiver, err1 := getUser(APIstub, newHolder)

	if err1 != nil || receiver == (User{}) {
		return shim.Error("Receiver doesn't exist.")
	}
	if receiver.Type == ENDUSER && (requestSender.Type == SUPPLIER || requestSender.Type == SOURCE) {
		asset.Status = true
	} // we do not want end users to be able to sell the product

	asset.Holder = newHolder
	asset.RecentFunction = "ChangeHolder"
	assetJsonAsBytes, err := json.Marshal(asset)
	if err!= nil {
		return shim.Error(err.Error())
	}
	err = APIstub.PutState(serialNumber, assetJsonAsBytes)

	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change holder of asset with serial number %s, %s",serialNumber, err.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully changed the holder of asset, Serial. No.: %s", serialNumber)))
}

// This function only allows the holder of an asset to change the status,
// MERCHANTs are the only holders allowed to change the status (for example in case that the fish is decayed)
// @param APIstub
// @return A response structure indicating success or failure with a message
// @param args
// What are the inputs?
//arg[0] = serial number
func (s *SmartContract) changeStatus (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) !=  1{
		return shim.Error("Incorrect number of arguments, expecting 1")
	}

	serialNumber := args[0]

	asset, err := getAsset(APIstub, serialNumber)

	if err != nil || asset == (Asset{}) {
		return shim.Error("Asset doesn't exist.")
	}

	if asset.Status == true {
		return shim.Error("The asset has already reached the destination.")
	}

	if asset.Holder != requestSender.AccountNumber || requestSender.Type != SOURCE || requestSender.Type != SUPPLIER  {
		return shim.Error("You are not allowed to change the status of this asset.")
	}

	asset.Status = true
	asset.RecentFunction = "ChangeStatus"
	assetJsonAsBytes, err := json.Marshal(asset)
	if err!= nil {
		return shim.Error(err.Error())
	}
	err = APIstub.PutState(serialNumber, assetJsonAsBytes)

	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change status of asset with serial number %s, %s",serialNumber, err.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully changed the status of asset, Serial. No.: %s", serialNumber)))
}

// This is an only admin function
// @param APIstub
// @param args The arguments array containing accountNumber to be deleted
//
// @return A response structure indicating success or failure with a message
// Admins can not delete themselves!
func (s *SmartContract) deleteUser (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if requestSender.Type != AdminOrg2 && requestSender.Type != AdminOrg1 {
		return shim.Error("Only admins can delete users.")
	}

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments, expecting 1")
	}

	accountNumber := args[0]

	user, err := getUser(APIstub, accountNumber)
	if err != nil || user == (User{}) {
		return shim.Error("User doesn't exist.")
	}

	if user.Type == AdminOrg1 || user.Type == AdminOrg2 {
		return shim.Error("No one can delete admins.")
	}
	// first we transferPrune existing deltas
	pruneResp, deltaSum := transferPrune(APIstub, &requestSender, true)
	if pruneResp.Status == ERROR {
		return shim.Error(fmt.Sprintf(
			"Could not transferPrune account deltas, deleting canceled. Try again. Error: %s", pruneResp.Message))
	}

	deltaSum += user.Balance

	// now we delete the account
	delErr := APIstub.DelState(accountNumber)
	if delErr != nil {
		return shim.Error(fmt.Sprintf("Could not delete the account %s: \n %s", accountNumber, delErr.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully deleted account, Acc. No.: %s and balance of the account is %d", accountNumber, deltaSum)))
}



// the function below returns all of the current key-value pairs giving start key and end key
// @param APIstub
// @param args The arguments array containing startKey, endKey
// @return A response string
//startKey := args[0]
//endKey := args[1]
func (s *SmartContract) getAllAssets (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

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
		buffer.WriteString(", \"Timestamp\":")
		//buffer.WriteString(strconv.FormatInt(queryResponse.Timestamp.Seconds,10))
		//buffer.WriteString("}")
		flag = true
	  }
	  buffer.WriteString("]")
	
	  //for debug purposes
	  fmt.Printf("- queryAllAsset:\n%s\n", buffer.String())
	
	  return shim.Success(buffer.Bytes())
	
}

// the function below returns the serialNumber of the asset that has been made from three other assets
// @param APIstub
// @param args The arguments array containing serialNumber of source asset 1, serialNumber of source asset 2
// serialNumber of source asset 3, serialNumber of asset made from the three other assets
// @return A response string
//input_serialNumber1 := args[0]
//input_serialNumber2 := args[1]
//input_serialNumber3 := args[2]
//output_serialNumber := args[3]

func (s *SmartContract) threeInputAssets (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 4 {
 		return shim.Error("Incorrect number of arguments. Expecting 4. Three input assets and 1 output asset.")
	}

 	input_serialNumber1 := args[0]
 	input_serialNumber2 := args[1]
 	input_serialNumber3 := args[2]
 	output_serialNumber := args[3]

 	asset1, err := getAsset(APIstub, input_serialNumber1)
 	if err != nil || asset1 == (Asset{}) {
 		return shim.Error("Asset 1 doesn't exist.")
 	}
 	if asset1.Status == true {
 		return shim.Error("Asset 1 can not be transformed. It has already reached the destination.")
 	}
 	if requestSender.AccountNumber != asset1.Holder {
 		return shim.Error("Only holder can use the asset !")
 	}

 	asset2, err := getAsset(APIstub, input_serialNumber2)
 	if err != nil || asset2 == (Asset{}) {
 		return shim.Error("Asset 2 doesn't exist.")
 	}
 	if asset2.Status == true {
 		return shim.Error("Asset 2 can not be transformed. It has already reached the destination.")
 	}
 	if requestSender.AccountNumber != asset2.Holder {
 		return shim.Error("Only holder can use the asset !")
 	}

 	asset3, err := getAsset(APIstub, input_serialNumber3)
 	if err != nil || asset3 == (Asset{}) {
 		return shim.Error("Asset 3 doesn't exist.")
 	}
 	if asset3.Status == true {
 		return shim.Error("Asset 3 can not be transformed. It has already reached the destination.")
 	}
 	if requestSender.AccountNumber != asset3.Holder {
 		return shim.Error("Only holder can use the asset !")
 	}

 	output_asset, err := getAsset(APIstub, output_serialNumber)
 	if err != nil || output_asset == (Asset{}) {
 		return shim.Error("Output asset doesn't exist.")
 	}
 	if output_asset.Status == true {
 		return shim.Error("Output asset can not be made. It has already reached the destination.")
 	}
 	if requestSender.AccountNumber != output_asset.Holder {
 		return shim.Error("Only holder can make the asset !")
 	}

 	asset1.Status = true
 	assetJsonAsBytes, err := json.Marshal(asset1)
 	if err!= nil {
 		return shim.Error(err.Error())
 	}
 	err = APIstub.PutState(asset1.SerialNumber, assetJsonAsBytes)

 	if err != nil {
 		return shim.Error(fmt.Sprintf("Failed to change status of asset with serial number %s, %s",asset1.SerialNumber, err.Error()))
 	}

 	asset2.Status = true
 	assetJsonAsBytes, err = json.Marshal(asset2)
 	if err!= nil {
 		return shim.Error(err.Error())
 	}
 	err = APIstub.PutState(asset2.SerialNumber, assetJsonAsBytes)

 	if err != nil {
 		return shim.Error(fmt.Sprintf("Failed to change status of asset with serial number %s, %s",asset2.SerialNumber, err.Error()))
 	}

 	asset3.Status = true
 	assetJsonAsBytes, err = json.Marshal(asset3)
 	if err!= nil {
 		return shim.Error(err.Error())
 	}
 	err = APIstub.PutState(asset3.SerialNumber, assetJsonAsBytes)

 	if err != nil {
 		return shim.Error(fmt.Sprintf("Failed to change status of asset with serial number %s, %s",asset3.SerialNumber, err.Error()))
 	}

 	return shim.Success([]byte(fmt.Sprintf("Successfully made asset %s from assets %s and %s and %s .", output_serialNumber , input_serialNumber2,input_serialNumber3, input_serialNumber1)))

 }




//
//
// the function below returns one asset history 
// @param APIstub
// @param args The arguments array containing serialNumber of asset
// @return A response string
//serialNumber:= args[0]
func (s *SmartContract) getOneAssetHistory (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	serialNumber := args[0]
	asset, err := getAsset(APIstub, serialNumber)
	// check whether the invoker is admin
	// or if user, check whether she has the access
	//if requestSender.Type != AdminOrg1 {
	//	return shim.Error("user not authorized")
	//}
	if err != nil || asset == (Asset{}) {
		return shim.Error("Asset doesn't exist.")
	}
	//if asset.Status == true {
	//	return shim.Error("Asset can not be transferred. It has already reached the destination.")
	//}
	iterator, err := APIstub.GetHistoryForKey(serialNumber)
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
	
	//Also note, that you need to make sure history db is enabled, in core.yaml file part of the ledger section:
	//ledger:
	// history:
	//# enableHistoryDatabase - options are true or false
	//# Indicates if the history of key updates should be stored.
	//# All history 'index' will be stored in goleveldb, regardless if using
	//# CouchDB or alternate database for the state.
	//	enableHistoryDatabase: true


}



// the function below returns one asset history with pagination
// @param APIstub
// @param args The arguments array containing serialNumber of asset, pageSize, bookmark
// @return A response string
//serialNumber:= args[0]
//pageSize := args[1]
//bookmark := args[2]
func (s *SmartContract) getOneAssetHistoryWithPagination (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	serialNumber := args[0]
	asset, err := getAsset(APIstub, serialNumber)
	// check whether the invoker is admin
	// or if user, check whether she has the access
	//if requestSender.Type != AdminOrg1 {
	//	return shim.Error("user not authorized")
	//}
	if err != nil || asset == (Asset{}) {
		return shim.Error("Asset doesn't exist.")
	}

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"asset\",\"seNo\":\"%s\"}}", args[0])

	pageSize, err := strconv.ParseInt(args[1], 10, 32)
	if err != nil {
		return shim.Error(err.Error())
	}
	bookmark := args[2]

	queryResults, err := getQueryResultForQueryStringWithPagination (APIstub, queryString, int32(pageSize), bookmark)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)


}





// Each user should know which assets belong to him/her
// the following finction gives back the result of assets that belong to some user
// @param APIstub
// @param args The arguments array containing accountNumber
// @return A response string
// 	accountnumber := args[0]
func (s *SmartContract) getUserAssets (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	if args[0] != requestSender.AccountNumber && requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2{
		return shim.Error("You do not have access to see the assets!")
	}


	//queryString := fmt.Sprintf(
	//	"{\"selector\":" +
	//		"{\"docType\":\"asset\" }," +
	//		"\"fields\":[\"pubKey\", \"seNo\" , \"recentFunc\", {\"holder\":\"%s\"}, \"type\", \"location\",\"temperature\",\"variable\",\"status\"]," +
	//		" \"sort\":[{\"timestamp\":\"desc\"}]," +
	//		"}",
	//		requestSender.AccountNumber)

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"asset\",\"holder\":\"%s\"}}", args[0])

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
			  fmt.Printf("- queryAllAssetforuser:\n%s\n", buffer.String())
			
			  return shim.Success(buffer.Bytes())
}


// Each user should know which assets belong to him/her
// the following finction gives back the result of assets that belong to some user
// @param APIstub
// @param args The arguments array containing accountNumber
// @return A response string
// 	accountnumber := args[0]
func (s *SmartContract) getUserAssetsWithPagination (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	if args[0] != requestSender.AccountNumber && requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2{
		return shim.Error("You do not have access to see the assets!")
	}

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"asset\",\"holder\":\"%s\"}}", args[0])

	pageSize, err := strconv.ParseInt(args[1], 10, 32)
	if err != nil {
		return shim.Error(err.Error())
	}
	bookmark := args[2]

	queryResults, err := getQueryResultForQueryStringWithPagination (APIstub, queryString, int32(pageSize), bookmark)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)

}



// =========================================================================================
// getQueryResultForQueryStringWithPagination executes the passed in query string with
// pagination info. Result set is built and returned as a byte array containing the JSON results.
// =========================================================================================
func getQueryResultForQueryStringWithPagination(APIstub shim.ChaincodeStubInterface, queryString string, pageSize int32, bookmark string) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, responseMetadata, err := APIstub.GetQueryResultWithPagination(queryString, pageSize, bookmark)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	buffer, err := constructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return nil, err
	}

	bufferWithPaginationInfo := addPaginationMetadataToQueryResults(buffer, responseMetadata)

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", bufferWithPaginationInfo.String())

	return buffer.Bytes(), nil
}

// ===========================================================================================
// constructQueryResponseFromIterator constructs a JSON array containing query results from
// a given result iterator
// ===========================================================================================
func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) (*bytes.Buffer, error) {
	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[[")

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

		buffer.WriteString(", \"Value\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	return &buffer, nil
}

// ===========================================================================================
// addPaginationMetadataToQueryResults adds QueryResponseMetadata, which contains pagination
// info, to the constructed query results
// ===========================================================================================
func addPaginationMetadataToQueryResults(buffer *bytes.Buffer, responseMetadata *peer.QueryResponseMetadata) *bytes.Buffer {
	
	buffer.WriteString(",")
	buffer.WriteString("{\"ResponseMetadata\":{\"RecordsCount\":")
	buffer.WriteString("\"")
	buffer.WriteString(fmt.Sprintf("%v", responseMetadata.FetchedRecordsCount))
	buffer.WriteString("\"")
	buffer.WriteString(", \"Bookmark\":")
	buffer.WriteString("\"")
	buffer.WriteString(responseMetadata.Bookmark)
	buffer.WriteString("\"}}]")

	return buffer
}