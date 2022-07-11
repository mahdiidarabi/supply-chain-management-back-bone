'use strict';
// -------------------- Setting ------------------------------
var log4js = require('log4js');
var logger = log4js.getLogger('UserRoute');
var express = require('express') ;
var router = express.Router()  ;

// -------------------- Database -----------------------------
var myAssetRdb = require('../database/database_requestAsset_func.js');
var assetDb = require('../database/database_asset_func.js');

// --------------------- Fabric -------------------------------
var invoke = require('../fabric/invoke-transaction.js');
var query = require('../fabric/query.js');


// -------------------- Error Function -------------------
function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

router.use(function(err ,req, res, next) {
  console.log('Time: ', Date.now())
  console.log(req.username);
  console.log('----------------------------- Insid User Route -----------------------' );
  return next();
})

// ---------------------Start Route------------------------


router.post('/GetBalance',async function(req, res){

  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO GET BALANCE (FOR ADMIN) ==================');
    var accountNumber = req.accountNumber ;
    var requestedPeer = req.body.peer ;
    var args = [accountNumber];
    var fcn = 'getBalance';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peer = requestedPeer ? requestedPeer : "peer0.org1.iranscm.tk";
    
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peer);
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
    res.send(message);
  }
  catch (err) {
    var response = {
     "success": false,
     "message": 'query Failed ...',
   }
    res.send(response) ;
  }

});

router.post('/Transfer',async function(req, res){

  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO GET BALANCE (FOR ADMIN) ==================');
    var sender = req.accountNumber;
    var receiver = req.body.receiver ;
    var amount = req.body.amount ;
    var description = req.body.description ? req.body.description : 'no description' ;
    var requestedPeers = req.body.peers ;

    if (!amount) {
      res.json(getErrorMessage('\'amount\''));
      return;
    }

    if (!receiver) {
      res.json(getErrorMessage('\'receiver\''));
      return;
    }

    var args = [sender,amount,receiver,description];
    var fcn = 'transfer';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peers = requestedPeers ? requestedPeers : ["peer0.org1.iranscm.tk","peer0.org2.iranscm.tk"];

    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peers);
    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
    var response = {
      "success" : message.success,
      "message" : message.message,
      "data"  : JSON.parse(message.metadata),
    }
    res.send(response);
  }
  catch (err) {
    var response = {
     "success": false,
     "message": 'invoke Failed ...',
   }
    res.send(response) ;
  }

});

router.post('/changeHolder',async function(req, res){
  try {

    if (!(req.userType == 'source' || req.userType == 'supplier')){
      var response = {
       "success": false,
       "message": 'user must be source or supplier',
     }
      res.send(response) ;
      return ;
    }

    logger.debug('==================== INVOKE ON CHAINCODE TO GET BALANCE (FOR ADMIN) ==================');
    var serialNumber = req.body.serialNumber;
    var newHolder = req.body.newHolder ;
    var requestedPeers = req.body.peers ;

    if (!serialNumber) {
      res.json(getErrorMessage('\'serialNumber\''));
      return;
    }

    if (!newHolder) {
      res.json(getErrorMessage('\'newHolder\''));
      return;
    }

    var args = [serialNumber,newHolder];
    var fcn = 'changeHolder';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peers = requestedPeers ? requestedPeers : ["peer0.org1.iranscm.tk","peer0.org2.iranscm.tk"];

    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peers);
    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
    // ! instead using chaincode for getting assets of a user, we do this
    if(message.success) {
      var dbResponse = await assetDb.userChangeHolder(serialNumber,newHolder,req.accountNumber);
      if (dbResponse.success){
        response = {
          success : true ,
          message : "holder changed successfully" ,
        }
      }
      else{
        response = {
          "success": false,
          "message": dbresponse.message,
        }
        res.status(401)
      }
    
    }

    res.send(message);

  }
  catch (err) {
    var response = {
     "success": false,
     "message": 'invoke Failed ...',
   }
    res.send(response) ;
  }

});

router.post('/requestAssets',async function(req, res){

  try {

    if (!(req.userType == 'source')){
      var response = {
       "success": false,
       "message": 'user must be source !',
     }
      res.send(response) ;
      return ;
    }

    logger.debug('==================== REQUEST ASSET TO DATA-BASE (FOR USER) ==================');
    var accountNumber = req.accountNumber;
    var assetsCount = req.body.assetsCount ;
    var isMicroRequested = req.body.isMicroRequested ;

    if (!accountNumber) {
      res.json(getErrorMessage('\'accountNumber\''));
      return;
    }

    if (!assetsCount) {
      res.json(getErrorMessage('\'assetsCount\''));
      return;
    }

    if (!isMicroRequested) {
      res.json(getErrorMessage('\'isMicroRequested\''));
      return;
    }

    var dbresponse = await myAssetRdb.requestAsset(accountNumber,assetsCount,isMicroRequested);
    console.log(JSON.stringify(dbresponse)) ;
    if (dbresponse.success){
      response = {
        success : true ,
        message : "Successfully submit your request" ,
        requestId : dbresponse.requestId
      }
    }
    else{
      response = {
        "success": false,
        "message": dbresponse.message,
      }
      res.status(401)
    }

    res.json(response)
  }
  catch (err) {
    var response = {
     "success": false,
     "message": 'Request Failed ...',
   }
    res.send(response) ;
  }

});

router.post('/confirmAsset',async function(req, res){
  try {

    if (!(req.userType == 'source')){
      var response = {
       "success": false,
       "message": 'user must be source',
     }
      res.send(response) ;
      return ;
    }

    logger.debug('==================== INVOKE ON CHAINCODE TO CONFIRM ASSET (FOR SOURCE) ==================');
    var serialNumber = req.body.serialNumber;
    var assetType = req.body.assetType ;
    var assetVar = req.body.assetVar ;
    var requestedPeers = req.body.peers ;

    if (!serialNumber) {
      res.json(getErrorMessage('\'serialNumber\''));
      return;
    }

    if (!assetType) {
      res.json(getErrorMessage('\'assetType\''));
      return;
    }

    var args = [serialNumber,assetType,assetVar];
    var fcn = 'confirmAsset';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peers = ["peer0.org1.iranscm.tk","peer0.org2.iranscm.tk"];

    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peers);
    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
	  var dbresponse = await assetDb.startAsset(serialNumber,req.accountNumber) ;
	
    res.send(message);
  }
  catch (err) {
    var response = {
      "success": false,
      "message": 'invoke Failed ...',
    }
    res.send(response) ;
  }

});

router.post('/findallAssetRequest', async function(req, res) {

  if (!(req.userType == 'source' )){
    var response = {
     "success": false,
     "message": 'user must be source ',
   }
    res.send(response) ;
    return ;
  }

  var response = '' ;
  var id = req.body.next
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await myAssetRdb.findAllAssetrequestByHolder(req.accountNumber,id,limit)
  console.log(JSON.stringify(dbresponse)) ;
  if (dbresponse.success){
    response = {
      success : true ,
      message : "user find Successfully" ,
      requests : dbresponse.requests
    }
  }
  else{
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});

router.post('/findConfirmedRequest', async function(req, res) {

  if (!(req.userType == 'source')){
    var response = {
     "success": false,
     "message": 'user must be source',
   }
    res.send(response) ;
    return ;
  }

  var response = '' ;
  var id = req.body.next
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await myAssetRdb.findConfirmedAssetrequestByHolder(req.accountNumber,id,limit)
  console.log(JSON.stringify(dbresponse)) ;
  if (dbresponse.success){
    response = {
      success : true ,
      message : "user find Successfully" ,
      requests : dbresponse.requests
    }
  }
  else{
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});

router.post('/findNotConfirmedRequest', async function(req, res) {

  if (!(req.userType == 'source')){
    var response = {
     "success": false,
     "message": 'user must be source',
   }
    res.send(response) ;
    return ;
  }

  var response = '' ;
  var id = req.body.next
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await myAssetRdb.findNotConfirmedAssetrequestByHolder(req.accountNumber,id,limit)
  console.log(JSON.stringify(dbresponse)) ;
  if (dbresponse.success){
    response = {
      success : true ,
      message : "user find Successfully" ,
      requests : dbresponse.requests
    }
  }
  else{
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});

router.post('/findRequestedAssetsById', async function(req, res) {

  if (!(req.userType == 'source')){
    var response = {
     "success": false,
     "message": 'user must be source',
   }
    res.send(response) ;
    return ;
  }

  var response = '' ;
  var requestId = req.body.requestId ;

  if (!requestId) {
    res.json(getErrorMessage('\'requestId\''));
    return;
  }

  var dbresponse = await assetDb.findUserAssetsByRequestId(req.accountNumber,requestId)
  console.log(JSON.stringify(dbresponse)) ;
  if (dbresponse.success){
    response = {
      success : true ,
      message : "user find Successfully" ,
      assets : dbresponse.assets
    }
  }
  else{
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});

router.post('/findAllRequestedAsset', async function(req, res) {

  if (!(req.userType == 'source')){
    var response = {
     "success": false,
     "message": 'user must be source',
   }
    res.send(response) ;
    return ;
  }

  var id = req.body.next
  var limit = req.body.limit ? req.body.limit : 30

  var response = '' ;
  var dbresponse = await assetDb.findAssetByFirstHolder(req.accountNumber,id,limit)
  console.log(JSON.stringify(dbresponse)) ;
  if (dbresponse.success){
    response = {
      success : true ,
      message : "user find Successfully" ,
      assets : dbresponse.assets
    }
  }
  else{
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});


router.post('/GetAssetState',async function(req, res){

  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO WHAT (FOR USER) ==================');
    var serialNumber = req.body.serialNumber ;
    var requestedPeer = req.body.peer ;
    var args = [serialNumber];
    // ? get last state of an asset (what)
    var fcn = 'what';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peer = requestedPeer ? requestedPeer : "peer1.org1.iranscm.tk";
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peer);
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
    var response = {
      "success" : message.success ,
      "message" : message.message,
      "data" : JSON.parse(message.metadata),
    }
    res.send(response);

  }
  catch (err) {
    var response = {
     "success": false,
     "message": 'query Failed ...',
   }
    res.send(response) ;
  }

});

router.post('/GetAssetHistory',async function(req, res){
  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO WHAT (FOR USER) ==================');
    var serialNumber = req.body.serialNumber ;
    var requestedPeer = req.body.peer ;
    var args = [serialNumber];
    // ? get last state of an asset (what)
    var fcn = 'getOneAssetHistory';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peer = requestedPeer ? requestedPeer : "peer1.org1.iranscm.tk";
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peer);
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
    var response = {
      "success" : message.success ,
      "message" : message.message,
      "data" : JSON.parse(message.metadata),
    }
    res.send(response)
  }
  catch (err) {
 
    
    var response = {
     "success": false,
     "message": 'query Failed ...',
   }
    res.send(response) ;
  }

});


router.post('/UserAssets',async function(req, res){
  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO WHAT (FOR USER) ==================');
    var accountNumber = req.accountNumber ;
    var requestedPeer = req.body.peer ;
    var limit = req.body.limit ? req.body.limit : "5"  ;
    var bookmark = req.body.next ? req.body.next : "" ;
    var args = [accountNumber,limit,bookmark];
    var fcn = 'getUserAssetsWithPagination';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peer = requestedPeer ? requestedPeer : "peer0.org1.iranscm.tk";
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peer);
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
    console.log("message is" + JSON.stringify(message) );
    var metadata = JSON.parse(message.metadata) ;
    var response = {
      "success" : message.success ,
      "message" : message.message,
      "data" : metadata[0],
      "next" : metadata[1].ResponseMetadata.Bookmark
    }
    res.send(response)
  }
  catch (err) {
    console.log(err);
    var response = {
     "success": false,
     "message": 'query Failed ...',
   }
    res.send(response) ;
  }

});


router.post('/GetTransactionHistory1',async function(req, res){
  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO WHAT (FOR USER) ==================');
    var requestedPeer = req.body.peer ;
    var args = [req.accountNumber];
    var fcn = 'getTransactionHistoryForUser1';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peer = requestedPeer ? requestedPeer : "peer0.org1.iranscm.tk";
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peer);
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
    var response = {
      "success" : message.success ,
      "message" : message.message,
      "data" : JSON.parse(message.metadata),
    }
    res.send(response)
  }
  catch (err) {
    var response = {
     "success": false,
     "message": 'query Failed ...',
   }
    res.send(response) ;
  }

});




router.post('/GetTransactionHistory2',async function(req, res){
  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO WHAT (FOR USER) ==================');
    var requestedPeer = req.body.peer ;
    var args = [req.accountNumber];
    var fcn = 'getTransactionHistoryForUser2';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peer = requestedPeer ? requestedPeer : "peer0.org1.iranscm.tk";
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peer);
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
    var response = {
      "success" : message.success ,
      "message" : message.message,
      "data" : JSON.parse(message.metadata),
    }
    res.send(response)
  }
  catch (err) {
    var response = {
     "success": false,
     "message": 'query Failed ...',
   }
    res.send(response) ;
  }

});





router.post('/GetTransactionHistory',async function(req, res){
  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO WHAT (FOR USER) ==================');
    var requestedPeer = req.body.peer ;
    var args = [req.accountNumber];
    var fcn = 'getUserTxs';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peer = requestedPeer ? requestedPeer : "peer0.org1.iranscm.tk";
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peer);
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
    var response = {
      "success" : message.success ,
      "message" : message.message,
      "data" : JSON.parse(message.metadata),
    }
    res.send(response)
  }
  catch (err) {
    var response = {
     "success": false,
     "message": 'query Failed ...',
   }
    res.send(response) ;
  }

});

module.exports = router
