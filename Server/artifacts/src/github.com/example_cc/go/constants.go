package main

const (

	//1EJ to chainCode ej ratio
	EjBaseRatio = 1000000 // 10^6

	//EJ Bank Start Amount (must multiply with base ratio)
	BankStartDeposit = 110000000 // 110,000,000

	TotalQueryLimit = 100000

	//EJ Bank Key
	EJBankKey = "Bank"

	//Composite key structs
	FeeDeltaIndexName      = "FeeDelta~feeAmountStr~txid~sender"
	TransferDeltaIndexName = "receiverAccountNumber~amountStr~txID"

	// Define Status codes for the response
	OK    = 200
	ERROR = 500

	//fees
	//MinimumOrdinaryFee uint64  = 500
	//MinimumBusinessFee uint64 = 100

	//keys
	//FeeHolderKey = "feeHolder"
	BaseTimeKey = "baseTime"

	//intervals
	OneMonthInterval = 1.0//43200.0

	// Invokable function names
	TRANSFER                     = "transfer"
	GetBalance                   = "getBalance"
	GetTransactionHistoryForUser = "getTransactionHistoryForUser"
	GetTransactionHistory 		 = "getTransactionHistory"
	TEST                         = "test"
	AddUser						 = "addUser"
    DeleteUser					 = "deleteUser"
    ConfirmAsset			     = "confirmAsset"
    InitAsset                    = "initAsset"
    ChangeHolder				 = "changeHolder"
	IssueForUser                 = "issueForUser"
	ChangeProperties             = "changeProperties"
	ChangeStatus				 = "changeStatus"
	GetAllAssetHistory			 = "getAllAssetHistory"
	GetOneAssetHistory           = "getOneAssetHistory"
	Who							 = "who"
	What                         = "what"
	ShowAllAssets				 = "showAllAssets"
	GetAllUsers                  = "getAllUsers"
	GetAllAssets				 = "getAllAssets"
	ThreeInputAssets			 = "threeInputAssets"
	GetUserAssets				 = "getUserAssets"
	GetUserAssetsWithPagination	 = "getUserAssetsWithPagination"
	Atomic						 = "atomic" 
	
	//Object types
	TransactionObjectType = "transaction"
	UserObjectType        = "user"
	AssetObjectType		  = "asset"
	
	//Initial Values
	InitialAssetType      = "notSet"
	InitialLocation       = "notSet"
	InitialTemp           = "0"
	InitialVar            = "notSet"


	// Account Type  (all of these are called USER and are created according to the USER struct)

	SOURCE    = "source"         // people who catch fish, people in the beginning process of supply chain
	SUPPLIER  = "supplier"		 // people who are in the middle supply chain management
	ENDUSER   = "enduser"		 // people who are end users (Do not read it endurser! It is end user. )
	AdminOrg1 = "admin1"
	AdminOrg2 = "admin2"

	// Asset Type
	Caviar	  = "caviar"

	//ORG Account numbers:

	//EJ CLUB:
	EjClubAccountNumber = "5"

	//EJ SUPPLY AND SUPERVISION CENTER
	EjSupervisorAccountNumber           = "1"
	EjSupervisorExpiredEjsAccountNumber = "2"
	EjSupervisorPublicAccountNumber     = "3"
	EjSupervisorFeesAccountNumber       = "4"

)
