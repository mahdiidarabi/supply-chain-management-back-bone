package main

// import packages, specially for interacting with fabric dockers
import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// The main function is only relevant in unit test mode. Only included here for completeness.
// This comment was here before, I'm not sure it's correct.
//var logger = shim.NewLogger("myChaincode")
func main() {
	// Create a new Smart Contract	
    //logger.SetLevel(shim.LogInfo)
    //logLevel, _ := shim.LogLevel(os.Getenv("SHIM_LOGGING_LEVEL"))
    //shim.SetLoggingLevel(logLevel)
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}

