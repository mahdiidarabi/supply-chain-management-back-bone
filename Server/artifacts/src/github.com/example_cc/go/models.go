package main

import "time"

//SmartContract is the data structure which represents this contract and on which various contract lifecycle functions are attached

type TransactionHistory struct {
	ObjectType    string    `json:"docType"`
	TransactionID string    `json:"id"`     //docType is used to distinguish the various types of objects in state database
	Sender        string    `json:"sender"` //the field tags are needed to keep case from bouncing around
	Receiver      string    `json:"receiver"`
	Value         uint64    `json:"value"`
	SenderFee     uint64    `json:"senderFee"`
	ReceiverFee   uint64    `json:"receiverFee"`
	Description   string    `json:"description"`
	Timestamp     time.Time `json:"timestamp"`
}

type User struct{
	ObjectType     string   `json:"docType"`
	Balance 	   uint64 	`json:"balance"`
	Type 		   string   `json:"type"`
	RecentFunction string   `json:"recentFunc"`
	PublicKey 	   string	`json:"pubKey"`
	AccountNumber  string	`json:"acNo"`
}

type Asset struct{
	ObjectType     string    `json:"docType"`
	PublicKey 	   string	 `json:"pubKey"`
	SerialNumber   string	 `json:"seNo"`
	RecentFunction string    `json:"recentFunc"`
	Holder         string    `json:"holder"`
	AssetType 	   string 	 `json:"type"`   // what kind of fish?
	Location 	   string	 `json:"location"`
	Temperature    string	 `json:"temperature"`
	Humidity       string	 `json:"humidity"`
	Variable       string	 `json:"variable"`
	Status         bool      `json:"status"`  // if true reached the destination
}


