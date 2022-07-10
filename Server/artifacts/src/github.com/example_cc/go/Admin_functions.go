package main
import (
	
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)


//
// @param APIstub
// @param args The arguments array containing accountNumber and amount
// This is an only-admin function.
// @return a response structure indicating success or failure with a message
func (s *SmartContract) addUser(APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {


	if requestSender.Type != AdminOrg2 && requestSender.Type != AdminOrg1 {
		return shim.Error("Only admins of org1 or org2 to add users!")
	} 

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments, expecting 3")
	}

	accountNumber := args[0]
	publicKey := args[1]
	userType := args[2]

	// check the user type
	if !(userType == SOURCE || userType == SUPPLIER || userType == ENDUSER || userType == AdminOrg1 || userType == AdminOrg2) {
		return shim.Error("invalid user type")
	}

	// check that the account doesn't already exist.
	if state, err := APIstub.GetState(accountNumber); state != nil || err != nil {
		return shim.Error("User with the current account number already exists.")
	}

	user := &User{
		ObjectType: UserObjectType,
		Balance: 0,
		Type: userType,
		PublicKey: publicKey,
		AccountNumber: accountNumber,
		RecentFunction : "AdminInitUser",
	}
    
    // convert Json to Bytes to store the data on the Blockchain
	userJsonAsBytes, err := json.Marshal(user)
	
	if err!= nil {
		return shim.Error(err.Error())
	}
	
	err = APIstub.PutState(accountNumber, userJsonAsBytes)

	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to put state: %s", err.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully created user, Acc. No.: %s", accountNumber)))
}

// This function only allows admin to add to the balance of one account
// @param APIstub
// @return A response structure indicating success or failure with a message
// @param args
//arg[0] = receiver account number
//arg[1] = amount that would be added to the balance
//func (s *SmartContract) addBalance (APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {
//
//	if requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2{
//		return shim.Error("Only admins of org1 or org2 can add to balance.")
//	}
//
//	if len(args) != 2 {
//		return shim.Error("Incorrect number of arguments, expecting 2")
//	}
//
//	receiver := args[0]
//	amount := args[1]
//
//	amountUint, err := strconv.ParseUint(amount, 10, 64)
//
//	if err != nil {
//		return shim.Error(err.Error())
//	}
//
//	err = withdrawFromBank(APIstub, amountUint)
//
//	if err != nil {
//		return shim.Error(err.Error())
//	}
//
//	deltaResponse := createTransferDelta(APIstub, receiver, amountUint)
//
//	return deltaResponse
//}
//

// This function only allows Admins to register an asset.
// @param APIstub
// @return A response structure indicating success or failure with a message
// @param args
// What are the inputs?
// ObjectType == AssetObjectType
// arg[0] = SerialNumber
// arg[1] = PublicKey
// arg[2] = AssetHolder
/// Status == false
// should seperate this function to two, registerAsset and confirmAsset
// register called by Admins and confirm called by sources upon their asset catch


func (s *SmartContract) initAsset(APIstub shim.ChaincodeStubInterface, requestSender User, args []string) peer.Response {


	if requestSender.Type != AdminOrg1 && requestSender.Type != AdminOrg2 {  // Org1 must
		return shim.Error("Only sources can add asset to the ledger!")
	}
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments, expecting 6")
	}

	serialNumber := args[0]
	publicKey := args[1]
	assetHolder := args[2]


	////err, temp:= strconv.Atoi(args[4])
	//assetTemperetaure, convErrAssetTemp := strconv.ParseUint(args[4], 10, 64)
	//
	//if convErrAssetTemp != nil {
	//	return shim.Error(fmt.Sprintf("Provided Tempretuare was not a number: %s",
	//		convErrAssetTemp.Error()))
	//}
	////assetTemperetaure := args[4]
	//assetVariable := args[5]
	//
	//// check the user type
	//if !(assetType == Caviar ) {
	//	return shim.Error("invalid asset type")
	//}


	// checking that the asset doesn't already exist.
	if state, err := APIstub.GetState(serialNumber); state != nil || err != nil {
		return shim.Error("Asset with the current serial number already exists.")
	}


	asset := &Asset{
		ObjectType:   AssetObjectType,
		AssetType:    InitialAssetType,
		PublicKey:    publicKey,
		SerialNumber: serialNumber,
		Holder:       assetHolder,
		Location:     InitialLocation,
		Temperature:  InitialTemp,
		Variable:     InitialVar,
		Status:       false,
		RecentFunction : "AdminInitAsset",
	}

	assetJsonAsBytes, err := json.Marshal(asset)
	if err!= nil {
		return shim.Error(err.Error())
	}
	err = APIstub.PutState(serialNumber, assetJsonAsBytes)

	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to create asset: %s", err.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully created asset, Serial. No.: %s", serialNumber)))
}

