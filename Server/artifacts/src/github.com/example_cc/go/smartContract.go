package main
import (
	"encoding/json"
	"fmt"
	"time"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

type SmartContract struct{}

// Init is called when smart contract is instantiated
// The smart contract receives four main arguments in the beginning to initiate the contract
// All the admins of 2 organizations are added in this part
// arg[0] = AccountNumber of admin 1
// arg[1] = AccountNumber of admin 2
// arg[2] = Pubkey of admin 1
// arg[3] = Pubkey of admin 2

func  (s *SmartContract) Init (APIstub shim.ChaincodeStubInterface) peer.Response {
	// Get the args from the transaction proposal
	_, args := APIstub.GetFunctionAndParameters()
	if len(args) != 4{
		return shim.Error("Incorrect arguments. Expecting 4 inputs!")
	}
	// set up any variables or assets here by calling stub.PutState()
	// store the key and the value on the ledger

	// assigning input values to related values of each admin
	admin1_AccountNumber := args[0]
	admin2_AccountNumber := args[1]
	admin1_PublicKey := args[2]
	admin2_PublicKey := args[3]
	
	// forming the struct corresponding to admin1
	Admin_1 := &User{
		ObjectType: UserObjectType,
		Balance:0,
		Type:AdminOrg1,
		PublicKey:admin1_PublicKey,
		AccountNumber:admin1_AccountNumber,
	}
	
	// transform the structs to a json object in order to be able to save it on the ledger
	admin1_JsonAsBytes, err := json.Marshal(Admin_1)
	
	if err!= nil {
		return shim.Error(fmt.Sprintf("error in admin1_JsonAsBytes: %s", err.Error()))
	}
	
	// storing the information of Admins on the ledger and notifying if an error occurred
	err = APIstub.PutState(admin1_AccountNumber, admin1_JsonAsBytes)
	
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to put state of Admin of Org1: %s", err.Error()))
	}

	// forming the struct corresponding to admin2
	Admin_2 := &User{
		ObjectType: UserObjectType,
		Balance:0,
		Type:AdminOrg1,
		PublicKey:admin2_PublicKey,
		AccountNumber:admin2_AccountNumber,
	}

	admin2_JsonAsBytes, err := json.Marshal(Admin_2)
	
	if err!= nil {
		return shim.Error(fmt.Sprintf("error in admin2_JsonAsBytes: %s", err.Error()))
	}

	err = APIstub.PutState(admin2_AccountNumber, admin2_JsonAsBytes)
	
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to put state of Admin of Org2: %s", err.Error()))
	}
	
	// saving chaincode creation timestamp
	baseTime := time.Now()

	baseTimeAsBytes, err := json.Marshal(baseTime)
	
	if err!= nil {
		return shim.Error(fmt.Sprintf("error in baseTimeAsBytes: %s", err.Error()))
	}

	putErr := APIstub.PutState(BaseTimeKey, baseTimeAsBytes)
	
	if putErr != nil {
		return shim.Error(fmt.Sprintf("Failed to put state: %s", putErr.Error()))
	}

	var StartDeposit uint64 = uint64(BankStartDeposit * EjBaseRatio)
	
	putErr = APIstub.PutState(EJBankKey, []byte(fmt.Sprint(StartDeposit)))

	if putErr != nil {
		return shim.Error(fmt.Sprintf("Failed to put state: %s", putErr.Error()))
	}

	//return shim.Success(fmt.Println("%q",admin1_JsonAsBytes))
	return shim.Success(nil)
}

//  Invoke routes invocations to the appropriate function in chaincode
//  Current supported invocations are:
//	- addUser      (admin only)
//	- deleteUser   (admin only)
//	- transfer
//	- changeHolder 
//	- addAsset     
//	- setBalance   (admin only)
//	- getBalance   (admin and user)  

func (s *SmartContract) Invoke (APIstub shim.ChaincodeStubInterface) peer.Response {

	// validate the sender at the begining
    // validate if the sender is an asset e.g. micro
	// check if requested account number matches the public key

	requestSender, err1 := validateSender(APIstub)
	requestAsset, err2  := validateAsset(APIstub)

	if err1 != nil && err2 !=nil {
		return shim.Error(fmt.Sprintf("Invalid asset or user: %s", err1.Error()))
	}

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	
	// connect each function with the appropriate handler
	if err1 == nil {   // a user is trying to call a function
		switch function {
		case TRANSFER:                      // This function transfers money from one user to another
			return s.transfer(APIstub, requestSender, args)
		case GetBalance:                    // Get the balance of user
			return s.getBalance(APIstub, requestSender, args)
		case GetTransactionHistoryForUser1:  // Get the transaction history for each user when value changed
			return s.getTransactionHistoryForUser1(APIstub, requestSender, args)
		case GetTransactionHistoryForUser2:  // Get the transaction history for each user by delta key
			return s.getTransactionHistoryForUser2(APIstub, requestSender, args)
		case GetAllUsers:                   // This function gives the current state of the users with account numbers form start-key to end-key
			return s.getAllUsers(APIstub, requestSender, args)
		//case GetTransactionHistory:       //??
		//	return s.getTransactionHistory(APIstub, requestSender, args)
		case GetAllAssets:                  // This function gets all the assets 
			return s.getAllAssets(APIstub, requestSender, args)
		case GetOneAssetHistory:            // This function returns the history of each asset.
			return s.getOneAssetHistory(APIstub, requestSender, args)
		case AddUser:                       // This function is an admin-only function. 
			return s.addUser(APIstub, requestSender, args)
		case DeleteUser:                    // This function allows admin to delete users. 
			return s.deleteUser(APIstub, requestSender, args)
		case InitAsset:                     // This function lets admin to register asset (micro) on the chain.
			return s.initAsset(APIstub, requestSender, args)
		case ConfirmAsset:                  // This function is invoked when Source adds the asset finally.
			return s.confirmAsset(APIstub, requestSender, args)
		case ChangeHolder:                  // The current holder of the asset can change the holder. 
			return s.changeHolder(APIstub, requestSender, args)
		case ChangeStatus:                  // This function changes the status of the asset.
			return s.changeStatus(APIstub, requestSender, args)
		case IssueForUser:                  // This function allows admin to increase the balance of one user.
			return s.issueForUser(APIstub, requestSender, args)   
		case Who:                           // This is a test function that gives back the identity of the one initiating the tx.
			return s.who(APIstub, args)
		case What:                        // This function returns the account number of the asset.
			return s.what(APIstub, args)
		case TEST:                          // for testing certificate attributes
			return s.test(APIstub, args)     
		case ChangeProperties:
			return s.changeProperties(APIstub, requestAsset , args)
		case GetUserAssets:
			return s.getUserAssets(APIstub, requestSender , args)
		case GetUserAssetsWithPagination:
			return s.getUserAssetsWithPagination(APIstub, requestSender , args)
		case ThreeInputAssets:
			return s.threeInputAssets(APIstub, requestSender , args)
		case GetUserTxsAsSender:
			return s.getUserTxsAsSender(APIstub, requestSender , args)
		case GetUserTxsAsReceiver:
			return s.getUserTxsAsReceiver(APIstub, requestSender , args)
		case GetUserTxs:
			return s.getUserTxs(APIstub, requestSender , args)
		case GetOneAssetHistoryWithPagination:
			return s.getOneAssetHistoryWithPagination(APIstub, requestSender , args)
		
		default:
			return shim.Error("Invalid Smart Contract function name1.")
		}
	}
	if err2 == nil {
		switch function {
			case ChangeProperties:
				return s.changeProperties(APIstub, requestAsset , args)
			default:
				return shim.Error("Invalid Smart Contract function name2.")
		}
	}
	return shim.Error("Invalid Operation or Input.")
}
