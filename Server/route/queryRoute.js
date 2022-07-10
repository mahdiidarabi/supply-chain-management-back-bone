//-------------------- General  Config -----------------------

var express = require('express');
var router = express.Router() ;

// ---------------------- Fabric Config -------------------
var query = require('../fabric/query.js');

//----------------- Server Config ------------------------
var serverConfig = require('../config-server.js') ;

// -------------------- Error Function -------------------
function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

router.use(function(req,res, next) {
  console.log('------------------------------ Insid Query -----------------------' );
  return next();
}) ;

// ---------------- Routes ---------------------------

// Query on chaincode on target peers
router.post('/channels/:channelName/chaincodes/:chaincodeName/query', async function(req, res) {

  try {
      logger.debug('==================== QUERY BY CHAINCODE ==================');
      var channelName = req.params.channelName;
      var chaincodeName = req.params.chaincodeName;
      let args = req.query.args;
      let fcn = req.query.fcn;
      let peer = req.query.peer;

      logger.debug('channelName : ' + channelName);
      logger.debug('chaincodeName : ' + chaincodeName);
      logger.debug('fcn : ' + fcn);
      logger.debug('args : ' + args);

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
      args = args.replace(/'/g, '"');
      args = JSON.parse(args);
      logger.debug(args);

      let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
      res.send(message);
  }
  catch (err){
      res.json(getErrorMessage('\'queryChaincode(fabric.router)\''));
  }
});

//  Query Get Block by BlockNumber
router.get('/channels/:channelName/blocks/:blockId', async function(req, res) {
  try {
      logger.debug('==================== GET BLOCK BY NUMBER ==================');
      let blockId = req.params.blockId;
      let peer = req.query.peer;
      logger.debug('channelName : ' + req.params.channelName);
      logger.debug('BlockID : ' + blockId);
      logger.debug('Peer : ' + peer);
      if (!blockId) {
          res.json(getErrorMessage('\'blockId\''));
          return;
      }

      let message = await query.getBlockByNumber(peer, req.params.channelName, blockId, req.username, req.orgname);
      res.send(message);
  }
  catch (err){
      res.json(getErrorMessage('\'queryBlock(fabric.router)\''));
  }
});

// Query Get Transaction by Transaction ID
router.get('/channels/:channelName/transactions/:trxnId', async function(req, res) {
  try {
      logger.debug('================ GET TRANSACTION BY TRANSACTION_ID ======================');
      logger.debug('channelName : ' + req.params.channelName);
      let trxnId = req.params.trxnId;
      let peer = req.query.peer;
      if (!trxnId) {
          res.json(getErrorMessage('\'trxnId\''));
          return;
      }

      let message = await query.getTransactionByID(peer, req.params.channelName, trxnId, req.username, req.orgname);
      res.send(message);
  }
  catch (err){
      res.json(getErrorMessage('\'queryTx(fabric.router)\''));
  }
});

// Query Get Block by Hash
router.get('/channels/:channelName/blocks', async function(req, res) {
  logger.debug('================ GET BLOCK BY HASH ======================');
  logger.debug('channelName : ' + req.params.channelName);
  let hash = req.query.hash;
  let peer = req.query.peer;
  if (!hash) {
    res.json(getErrorMessage('\'hash\''));
    return;
  }

  let message = await query.getBlockByHash(peer, req.params.channelName, hash, req.username, req.orgname);
  res.send(message);
});

//Query for Channel Information
router.get('/channels/:channelName', async function(req, res) {
  logger.debug('================ GET CHANNEL INFORMATION ======================');
  logger.debug('channelName : ' + req.params.channelName);
  let peer = req.query.peer;

  let message = await query.getChainInfo(peer, req.params.channelName, req.username, req.orgname);
  res.send(message);
});

//Query for Channel instantiated chaincodes
router.get('/channels/:channelName/chaincodes', async function(req, res) {
  logger.debug('================ GET INSTANTIATED CHAINCODES ======================');
  logger.debug('channelName : ' + req.params.channelName);
  let peer = req.query.peer;

  let message = await query.getInstalledChaincodes(peer, req.params.channelName, 'instantiated', req.username, req.orgname);
  res.send(message);
});

// Query to fetch all Installed/instantiated chaincodes
router.get('/chaincodes', async function(req, res) {
  var peer = req.query.peer;
  var installType = req.query.type;
  logger.debug('================ GET INSTALLED CHAINCODES ======================');

  let message = await query.getInstalledChaincodes(peer, null, 'installed', req.username, req.orgname)
  res.send(message);
});

// Query to fetch channels
router.get('/channels', async function(req, res) {
  logger.debug('================ GET CHANNELS ======================');
  logger.debug('peer: ' + req.query.peer);
  var peer = req.query.peer;
  if (!peer) {
    res.json(getErrorMessage('\'peer\''));
    return;
  }

  let message = await query.getChannels(peer, req.username, req.orgname);
  res.send(message);
});

module.exports = router
