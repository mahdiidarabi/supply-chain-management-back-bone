
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('FabricRoute');
var express = require('express');
var router = express.Router();

//---------------- Fabric ----------------------
var helper = require('../fabric/helper.js');
var helperCA = require('../fabric/helper-CA.js');
var createChannel = require('../fabric/create-channel.js');
var join = require('../fabric/join-channel.js');
var updateAnchorPeers = require('../fabric/update-anchor-peers.js');
var install = require('../fabric/install-chaincode.js');
var instantiate = require('../fabric/instantiate-chaincode.js');
var invoke = require('../fabric/invoke-transaction.js');
var query = require('../fabric/query.js');

// -------------------- Database ------------------
var mydb = require('../database/database_user_func.js') ;

// ------------------ Error Function ---------------
function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

// -------------------- Check Admin ------------------------
router.use(async function(req, res, next) {
  console.log('Time: ', Date.now())
  console.log(req.username);
  console.log('------------------------------ Insid Fabric Route -----------------------' );

  var dbresponse = await mydb.findUserByUsername(req.username) ;
  if (dbresponse.success){
    if(dbresponse.user.isadmin == true){
      return next() ;
    }
    else{
      response = {
       "success": false,
       "message": 'user must be admin',
     }
     res.send(response) ;
    }
  }
  else{
    response = {
     "success": false,
     "message": dbresponse.message,
   }
   res.send(response) ;
  }
  return ;
})

// --------------------- Statrt Route ----------------------

// Create Channel
router.post('/channels', async function(req, res) {
  try {
    logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
    logger.debug('End point : /channels');
    var channelName = req.body.channelName;
    var channelConfigPath = req.body.channelConfigPath;
    logger.debug('Channel name : ' + channelName);
    logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
    if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
    }
    if (!channelConfigPath) {
      res.json(getErrorMessage('\'channelConfigPath\''));
      return;
    }

    let message = await createChannel.createChannel(channelName, channelConfigPath, req.username, req.orgname);
    res.send(message);
  }
  catch (err) {
    res.json(getErrorMessage('\'channels(fabric.router)\''));
  }
});

// Join Channel
router.post('/channels/:channelName/peers', async function(req, res) {
  try {
    logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
    var channelName = req.params.channelName;
    var peers = req.body.peers;
    logger.debug('channelName : ' + channelName);
    logger.debug('peers : ' + peers);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
    }
    if (!peers || peers.length == 0) {
      res.json(getErrorMessage('\'peers\''));
      return;
    }

    let message =  await join.joinChannel(channelName, peers, req.username, req.orgname);
    res.send(message);
  }
  catch (err){
    res.json(getErrorMessage('\'peers(fabric.router)\''));
  }
});

// Update anchor peers
router.post('/channels/:channelName/anchorpeers', async function(req, res) {
  try {
    logger.debug('==================== UPDATE ANCHOR PEERS ==================');
    var channelName = req.params.channelName;
    var configUpdatePath = req.body.configUpdatePath;
    logger.debug('Channel name : ' + channelName);
    logger.debug('configUpdatePath : ' + configUpdatePath);
    if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
    }
    if (!configUpdatePath) {
      res.json(getErrorMessage('\'configUpdatePath\''));
      return;
    }

    let message = await updateAnchorPeers.updateAnchorPeers(channelName, configUpdatePath, req.username, req.orgname);
    res.send(message);
  }
  catch (err){
    res.json(getErrorMessage('\'anchorpeers(fabric.router)\''));
  }
});

// Install chaincode on target peers
router.post('/chaincodes', async function(req, res) {
  try {
    logger.debug('==================== INSTALL CHAINCODE ==================');
    var peers = req.body.peers;
    var chaincodeName = req.body.chaincodeName;
    var chaincodePath = req.body.chaincodePath;
    var chaincodeVersion = req.body.chaincodeVersion;
    var chaincodeType = req.body.chaincodeType;
    logger.debug('peers : ' + peers); // target peers list
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('chaincodePath  : ' + chaincodePath);
    logger.debug('chaincodeVersion  : ' + chaincodeVersion);
    logger.debug('chaincodeType  : ' + chaincodeType);
    if (!peers || peers.length == 0) {
      res.json(getErrorMessage('\'peers\''));
      return;
    }
    if (!chaincodeName) {
      res.json(getErrorMessage('\'chaincodeName\''));
      return;
    }
    if (!chaincodePath) {
      res.json(getErrorMessage('\'chaincodePath\''));
      return;
    }
    if (!chaincodeVersion) {
      res.json(getErrorMessage('\'chaincodeVersion\''));
      return;
    }
    if (!chaincodeType) {
      res.json(getErrorMessage('\'chaincodeType\''));
      return;
    }
    let message = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.username, req.orgname)
    res.send(message);
  }
  catch (err){
    res.json(getErrorMessage('\'chaincodes(fabric.router)\''));
  }
});

// Instantiate chaincode on target peers
router.post('/channels/:channelName/chaincodes', async function(req, res) {
  logger.debug('==================== INSTANTIATE CHAINCODE ==================');
  var peers = req.body.peers;
  var chaincodeName = req.body.chaincodeName;
  var chaincodeVersion = req.body.chaincodeVersion;
  var channelName = req.params.channelName;
  var chaincodeType = req.body.chaincodeType;
  var fcn = req.body.fcn;

  let response1 = await helperCA.getRegisteredUser('Admin1', 'Org1', 1111111111, true);
  let response2 = await helperCA.getRegisteredUser('Admin2', 'Org2', 2222222222, true);
  var adminPubliKey1 = await helper.getPublicKey('Admin1','Org1');
  var adminPubliKey2 = await helper.getPublicKey('Admin2','Org2');
  logger.debug('==================== pub.key1 ==================');
  logger.debug(adminPubliKey1);
  logger.debug('==================== pub.key2 ==================');
  logger.debug(adminPubliKey2);
  var args = ['1111111111','2222222222',adminPubliKey1,adminPubliKey2];
  logger.debug('peers  : ' + peers);
  logger.debug('channelName  : ' + channelName);
  logger.debug('chaincodeName : ' + chaincodeName);
  logger.debug('chaincodeVersion  : ' + chaincodeVersion);
  logger.debug('chaincodeType  : ' + chaincodeType);
  logger.debug('args  : ' + args);
  if (!chaincodeName) {
    res.json(getErrorMessage('\'chaincodeName\''));
    return;
  }
  if (!chaincodeVersion) {
    res.json(getErrorMessage('\'chaincodeVersion\''));
    return;
  }
  if (!channelName) {
    res.json(getErrorMessage('\'channelName\''));
    return;
  }
  if (!chaincodeType) {
    res.json(getErrorMessage('\'chaincodeType\''));
    return;
  }
  if (!args) {
    res.json(getErrorMessage('\'args\''));
    return;
  }

  let message = await instantiate.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, req.username, req.orgname);
  res.send(message);
});

// Invoke transaction on chaincode on target peers
router.post('/channels/:channelName/chaincodes/:chaincodeName/invoke', async function (req, res) {
  try {
    logger.debug('==================== INVOKE ON CHAINCODE (FOR ADMIN) ==================');
    var peers = req.body.peers;
    var chaincodeName = req.params.chaincodeName;
    var channelName = req.params.channelName;
    var fcn = req.body.fcn;
    var args = req.body.args;
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    if (!chaincodeName) {
      res.json(getErrorMessage('\'chaincodeName\''));
      return;
    }
    if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
    }
    if (!fcn) {
      res.json(getErrorMessage('\'fcn\''));
      return;
    }
    if (!args) {
      res.json(getErrorMessage('\'args\''));
      return;
    }

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
    res.send(message);
  }
  catch (err) {
    res.json(getErrorMessage('\'invokeAdmin(admin.router)\''));
  }
});

module.exports = router
