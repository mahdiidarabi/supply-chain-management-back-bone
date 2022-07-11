'use strict';
// -------------------- Setting ------------------------------
var log4js = require('log4js');
var logger = log4js.getLogger('UserRoute');
var express = require('express');
var router = express.Router();

// -------------------- Database -----------------------------
var assetDb = require('../database/database_asset_func.js');

// --------------------- Fabric -------------------------------
var invoke = require('../fabric/invoke-transaction.js');
var query = require('../fabric/query.js');
var helper = require('../fabric/helper.js');
var helperCA = require('../fabric/helper-CA.js');

// -------------------- Error Function -------------------
function getErrorMessage(field) {
  var response = {
    success: false,
    message: field + ' field is missing or Invalid in the request'
  };
  return response;
}

router.use(function (err, req, res, next) {
  console.log('Time: ', Date.now())
  console.log(req.username);
  console.log('----------------------------- Insid User Route -----------------------');
  if (req.userType != "Micro") {
    var response = {
      "success": false,
      "message": 'user must be micro',
    }
    res.send(response);
  }
  return next();
})

// --------------------- Routes------------------------

router.post('/GetMicroAsset', async function (req, res) {
  try {
    res.send("Ok");
  }
  catch (err) {
    var response = {
      "success": false,
      "message": 'invoke Failed ...',
    }
    res.send(response);
  }
});

router.post('/ChangeProp', async function (req, res) {
  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO CHANGE PROPERTIES (FOR MICRO) ==================');
    var serialNumber = req.serialNumber;
    var newTemp = req.body.newTemp;
    var newLocation = req.body.newLocation;
    var newHumidity = req.body.newHumidity;

    var requestedPeers = req.body.peers;

    console.log("serial nmberis " + serialNumber);
    console.log(req.microId)

    console.log('body of changeProp request is fetched');

    if (!serialNumber) {
      res.json(getErrorMessage('\'serialNumber\''));
      return;
    }

    if (!newLocation) {
      res.json(getErrorMessage('\'newLocation\''));
      return;
    }
    if (!newHumidity) {
      res.json(getErrorMessage('\'newHumidity\''));
      return;
    }
    if (!newTemp) {
      res.json(getErrorMessage('\'tempreture\''));
      return;
    }

    var args = [newLocation, newTemp, newHumidity]
    var fcn = 'changeProperties';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peers = requestedPeers ? requestedPeers : ["peer0.org1.iranscm.tk", "peer0.org2.iranscm.tk"];

    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peer  : ' + peers);
    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.microId, req.orgname);
    console.log('invoking chaincode in changeProp api');
    res.send(message);
    return;
  }
  catch (err) {
    var response = {
      "success": false,
      "message": 'invoke Failed for chainging properties by micro',
    }
    res.send(response);
    return;
  }

});

router.post('/serverInitMicro', async function (req, res) {
  try {
    var dbResponse = await assetDb.findNotInitMicroAsset(null, 1);
    if (dbResponse.success) {
      var microId = dbResponse.assets[0].micro_id
      var dbResponse2 = await assetDb.serverInitMicro(microId);
      if (dbResponse2.success) {
        var response = {
          "success": true,
          "id": microId
        }
        res.send(response);
      }
    }
    var response = {
      "success": false,
    }
    res.send(response);

  }
  catch (err) {
    var response = {
      "success": false,
      "message": 'invoke Failed ...',
    }
    res.send(response);
  }
});

module.exports = router
