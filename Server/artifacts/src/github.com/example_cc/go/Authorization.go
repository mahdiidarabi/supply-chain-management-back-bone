
package main

import (
	"crypto/x509"
	//"encoding/json"
	"encoding/pem"
	"github.com/hyperledger/fabric/core/chaincode/lib/cid"
	"encoding/json"
	"fmt"
	"errors"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)


// this function called when Invoke is called
// this function gives request sender as 'user' model that defines in in vendor file
func validateSender(APIstub shim.ChaincodeStubInterface) (User, error) {
	//retrieve data of the user sending the request

	certificateAccountNumber, hasAttr, err := cid.GetAttributeValue(APIstub, "accountNumber")
	if err != nil {
		return User{}, errors.New(fmt.Sprintf("Error getting attribute (accountNumber) value: %s", err.Error()))
	}
	if !hasAttr {
		return User{}, errors.New(fmt.Sprintf("accountNumber attribute not found."))
	}

	usr, err := getUser(APIstub, certificateAccountNumber)

	if err != nil {
		//return User{}, errors.New(fmt.Sprintf("error getting user: %s", err.Error()))
		return usr, errors.New(fmt.Sprintf("error getting user: %s", usr.PublicKey ))
	}

	certificate, err := cid.GetX509Certificate(APIstub)

	if err != nil {
		return User{}, fmt.Errorf("error getting X509Certificate, %s", err.Error())
	}

	block, rest := pem.Decode([]byte(usr.PublicKey))

	if block == nil {
		return User{}, fmt.Errorf("failed to parse PEM block containing the public key with rest:\n" +
			string(rest) + "\n" + usr.PublicKey)
	}

	userPublicKey, err := x509.ParsePKIXPublicKey(block.Bytes)

	if err != nil {
		return User{}, fmt.Errorf("error parsing public key, %s", err.Error())
	}

	if fmt.Sprintf("%v", certificate.PublicKey) != fmt.Sprintf("%v",userPublicKey){
		return User{}, errors.New("invalid certificate: public key mismatch : \n " +
			fmt.Sprintf("%v", certificate.PublicKey) + " \n != \n " + fmt.Sprintf("%v",userPublicKey))
	}

	return usr, nil
}

// this function called in validateSender
// getUser gives 'user' as a model by passing accountNumber
func getUser(APIstub shim.ChaincodeStubInterface, accountNumber string) (User, error) {

	userAsBytes, err := APIstub.GetState(accountNumber)
	usr := User{}
	if err != nil {
		return usr, err
	}
	//fmt.Sprintf("error in GetState in getUser, %s", err.Error())
	// fmt.Sprintf("%s", string(userAsBytes))

	err = json.Unmarshal(userAsBytes, &usr)
	if err != nil {
		return usr, errors.New(fmt.Sprintf("Error in getUserَ : %s ", err.Error()))
	}
	//fmt.Sprintf("error in Unmarshal in getUser, %s", err.Error())
	usr.AccountNumber = accountNumber
	return usr, nil
}

//
// This function is to check whether the sender of data to change properties is the asset itself
func validateAsset(APIstub shim.ChaincodeStubInterface) (Asset, error) {
	//retrieve data of the asset sending the request

	certificateSerialNumber, hasAttr, err := cid.GetAttributeValue(APIstub, "accountNumber")
	if err != nil {
		return Asset{}, errors.New(fmt.Sprintf("Error getting attribute (serialNumber) value: %s", err.Error()))
	}
	if !hasAttr {
		return Asset{}, errors.New(fmt.Sprintf("serialNumber attribute not found."))
	}

	_asset, err := getAsset(APIstub, certificateSerialNumber)

	if err != nil {
		return Asset{}, errors.New(fmt.Sprintf("error getting asset: %s", err.Error()))
	}

	certificate, err := cid.GetX509Certificate(APIstub)

	if err != nil {
		return Asset{}, fmt.Errorf("error getting X509Certificate, %s", err.Error())
	}

	block, rest := pem.Decode([]byte(_asset.PublicKey))

	if block == nil {
		return Asset{}, fmt.Errorf("failed to parse PEM block containing the public key with rest:\n" +
			string(rest) + "\n" + _asset.PublicKey)
	}

	assetPublicKey, err := x509.ParsePKIXPublicKey(block.Bytes)

	if err != nil {
		return Asset{}, fmt.Errorf("error parsing public key, %s", err.Error())
	}

	if fmt.Sprintf("%v", certificate.PublicKey) != fmt.Sprintf("%v",assetPublicKey){
		return Asset{}, errors.New("invalid certificate: public key mismatch : \n " +
			fmt.Sprintf("%v", certificate.PublicKey) + " \n != \n " + fmt.Sprintf("%v",assetPublicKey))
	}

	return _asset, nil
}

// this function called in validateAsset
// getAsset gives 'asset' as a model by passing serialNumber
func getAsset(APIstub shim.ChaincodeStubInterface, serialNumber string) (Asset, error) {

	assetAsBytes, err := APIstub.GetState(serialNumber)
	asset := Asset{}
	if err != nil {
		return asset, err
	}
	//fmt.Sprintf("error in GetState in getAsset , %s", err.Error())

	err = json.Unmarshal(assetAsBytes, &asset)
	if err != nil {
		return asset, errors.New(fmt.Sprintf("Error in getAssetَ : %s  %s", err.Error(), string(assetAsBytes)))
	}
	//fmt.Sprintf("error in Unmarshal in getAsset , %s", err.Error())
	asset.SerialNumber = serialNumber
	return asset, nil
}
