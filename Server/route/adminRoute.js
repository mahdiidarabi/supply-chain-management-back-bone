
'use strict';
// -------------------- Setting ------------------------------
var log4js = require('log4js');
var logger = log4js.getLogger('AdminRoute');
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var serverConfig = require('../config-server.js');
// ------------------- Database ---------------------------
var mydb = require('../database/database_user_func.js');
var myAssetRdb = require('../database/database_requestAsset_func.js');
var assetDb = require('../database/database_asset_func.js');

// ------------------- Fabric ---------------------------
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

// -------------------- Check Admin ------------------------

router.use(async function (req, res, next) {
  console.log('Time: ', Date.now())
  console.log(req.username);
  console.log('------------------------------ Insid Admin Route -----------------------');

  var dbresponse = await mydb.findUserByUsername(req.username);
  if (dbresponse.success) {
    if (dbresponse.user.isadmin == true) {
      return next();
    }
    else {
      var response = {
        "success": false,
        "message": 'user must be admin',
      }
      res.send(response);
    }
  }
  else {
    var response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.send(response);
  }
  return;
})

// ---------------------Start Route------------------------

router.post('/ConfirmUser', async function (req, res) {
  var response = '';
  var username = req.body.username;
  var orgName = req.orgname;
  var isAdmin = !req.body.isAdmin ? false : true;
  //var userType = !req.body.userType ? 'source' : req.body.userType ;
  if (!username) {
    res.json(getErrorMessage('\'username\''));
    return;
  }

  var accountNumber = Math.floor(Math.random() * 9000000000 + 1000000000);
  var isConfirmed = req.body.isConfirmed;



  if (isConfirmed == 'true') {
    var dbresponse2 = await mydb.findUserByUsername(username);
    if (!dbresponse2.success) {
      var response = {
        "success": false,
        "message": dbresponse2.message,
      }
      res.status(401)
      res.json(response);
      return;
    }
    var userType = dbresponse2.user.user_type;
    var isAdminRequest = userType == 'admin1' || userType == 'admin2';

    if (isAdminRequest != isAdmin) {
      res.json(getErrorMessage('\'isAdmin\''));
      return;
    }

    if (dbresponse2.success) {
      if (dbresponse2.user.account_number > 0 && dbresponse2.user.isconfirmed == false) {
        var dbresponse = await mydb.adminConfirmUser(username, isAdmin);
      }
      else {
        if (!dbresponse2.user.isconfirmed) {
          var dbresponse1 = await mydb.adminSetAccountnumber(username, accountNumber);
          var dbresponse2 = await mydb.findUserByUsername(username);
          accountNumber = dbresponse2.user.account_number;
          let caResponse = await helperCA.getRegisteredUser(username, orgName, accountNumber, true);
          var peers = ["peer0.org1.iranscm.tk", "peer0.org2.iranscm.tk"]
          var fcn = "addUser"
          var userPublicKey = await helper.getPublicKey(username, orgName);
          var args = [accountNumber.toString(), userPublicKey, userType]
          let invokeMessage = await invoke.invokeChaincode(peers, 'mychannel', 'mycc', fcn, args, req.username, req.orgname);
          console.log(invokeMessage)
          if (!invokeMessage.success) {
            response = {
              "success": false,
              "message": invokeMessage.message,
            }
            res.status(401)
            res.json(response)
            return;
          }
        }

        var dbresponse = await mydb.adminConfirmUser(username, isAdmin);
      }
    }
    else {
      dbresponse = dbresponse2;
    }

  }
  else {
    var dbresponse = await mydb.adminRejectUser(username)
  }

  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    response = {
      success: true,
      message: dbresponse.message,
      user: dbresponse.user
    }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(response)
});

router.post('/finduser', async function (req, res) {
  var response = '';
  var username = req.body.username;
  if (!username) {
    res.json(getErrorMessage('\'username\''));
    return;
  }

  var dbresponse = await mydb.findUserByUsername(username)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    response = {
      success: true,
      message: "user find Successfully",
      user: dbresponse.user
    }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(response)
});

router.post('/findalluser', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 10
  var dbresponse = await mydb.findAllUser(id, limit)
  console.log(JSON.stringify(dbresponse));
  res.json(dbresponse)
});

router.post('/findconfirmeduser', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 10
  var dbresponse = await mydb.findConfirmedUser(id, limit)
  console.log(JSON.stringify(dbresponse));
  res.json(dbresponse)
});

router.post('/findRejectedUser', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 10
  var dbresponse = await mydb.findRejectedUser(id, limit)
  console.log(JSON.stringify(dbresponse));
  res.json(dbresponse)
});

router.post('/findNotseenuser', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 10
  var dbresponse = await mydb.findNotseenUser(id, limit)
  console.log(JSON.stringify(dbresponse));
  res.json(dbresponse)
});

router.post('/GetBalance', async function (req, res) {

  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO GET BALANCE (FOR ADMIN) ==================');
    var accountNumber = req.body.accountNumber;
    var requestedPeer = req.body.peer;

    if (!accountNumber) {
      res.json(getErrorMessage('\'accountNumber\''));
      return;
    }

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
    //let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
    res.send(message);
  }
  catch (err) {
    var response = {
      "success": false,
      "message": 'query Failed ...',
    }
    res.send(response);
  }

});

router.post('/IssueForUser', async function (req, res) {
  try {
    logger.debug('==================== INVOKE ON CHAINCODE TO ISSUE FOR USER (ADMIN) ==================');
    var accountNumber = req.body.accountNumber;
    var amount = req.body.amount;
    var requestedPeers = req.body.peers;
    if (!accountNumber) {
      res.json(getErrorMessage('\'accountNumber\''));
      return;
    }
    if (!amount) {
      res.json(getErrorMessage('\'amount\''));
      return;
    }
    var args = [accountNumber, amount];
    var fcn = 'issueForUser';
    var chaincodeName = 'mycc';
    var channelName = 'mychannel';
    var peers = requestedPeers ? requestedPeers : ["peer0.org1.iranscm.tk", "peer0.org2.iranscm.tk"];

    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('peers  : ' + peers);
    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
    res.send(message);
  }
  catch (err) {
    var response = {
      "success": false,
      "message": 'invoke Failed ...',
    }
    res.send(response);
  }

});

router.post('/ConfirmAndAddAssets', async function (req, res) {

  var response = '';
  var requestId = req.body.requestId;
  var confirmAssetCount = parseInt(req.body.confirmAssetCount, 10);

  // //var microId = req.body.microId


  if (!requestId) {
    res.json(getErrorMessage('\'requestId\''));
    return;
  }
  if (!confirmAssetCount) {
    res.json(getErrorMessage('\'confirmAssetCount\''));
    return;
  }


  var dbresponse2 = await myAssetRdb.findAssetrequestById(requestId);
  var assetCount = dbresponse2.request.assets_count;
  var lastconfirmedassetCount = dbresponse2.request.confirmed_assets_count;

  if (dbresponse2.request.is_request_ended) {
    response = {
      "success": false,
      "message": 'this request confirmed previously',
    }
    res.status(401)
    res.json(response)
    return;
  }


  if (confirmAssetCount + lastconfirmedassetCount > assetCount) {
    response = {
      "success": false,
      "message": 'cant add asset more than requested asset',
    }
    res.status(401)
    res.json(response)
    return;
  }



  var isMicroRequested = dbresponse2.request.is_micro_requested;
  var holder = dbresponse2.request.account_number;

  var x = 0;
  var userSerialNumbers = [];
  for (var i = 0; i < confirmAssetCount; i += 1) {
    if (isMicroRequested) {
      var serialNumber = Math.floor(Math.random() * 9000000000 + 1000000000);
      var microId = "micro_" + serialNumber.toString();
      let caResponse = await helperCA.getRegisteredUser(microId, req.orgname, serialNumber, true);
      var peers = ["peer0.org1.iranscm.tk", "peer0.org2.iranscm.tk"]
      var fcn = "initAsset"
      var microPublicKey = await helper.getPublicKey(microId, req.orgname);
      var args = [serialNumber.toString(), microPublicKey, holder]
      let invokeMessage = await invoke.invokeChaincode(peers, 'mychannel', 'mycc', fcn, args, req.username, req.orgname);
      console.log(invokeMessage)
      if (!invokeMessage.success) {
        response = {
          "success": false,
          "message": invokeMessage.message,
        }
        res.status(401)
        res.json(response)
        return;
      }
      var dbresponse3 = assetDb.addAsset(requestId, serialNumber, holder, microId, "iranscm.tk")
      x += 1;
      userSerialNumbers.push(serialNumber)
    }
    else {
      var serialNumber = Math.floor(Math.random() * 9000000000 + 1000000000);
      var peers = ["peer0.org1.iranscm.tk", "peer0.org2.iranscm.tk"]
      var fcn = "initAsset"
      var microPublicKey = serialNumber.toString();
      var args = [serialNumber.toString(), microPublicKey, holder]
      let invokeMessage = await invoke.invokeChaincode(peers, 'mychannel', 'mycc', fcn, args, req.username, req.orgname);
      console.log(invokeMessage)
      if (!invokeMessage.success) {
        response = {
          "success": false,
          "message": invokeMessage.message,
        }
        res.status(401)
        res.json(response)
        return;
      }
      var dbresponse3 = await assetDb.addAsset(requestId, serialNumber, holder, null, null);
      x += 1;
      userSerialNumbers.push(serialNumber)
    }
  }
  if (x < confirmAssetCount) {
    var dbresponse = await myAssetRdb.adminConfirmAssetRequest(requestId, lastconfirmedassetCount + x, false);
    console.log(JSON.stringify(dbresponse));
    if (dbresponse.success) {
      response = {
        success: false,
        message: x + ' of ' + confirmAssetCount + ' assets confirmed',
        assets: userSerialNumbers
      }
      res.json(response)
      return;
    }
  }
  else {
    var dbresponse = await myAssetRdb.adminConfirmAssetRequest(requestId, lastconfirmedassetCount + x, true);
    console.log(JSON.stringify(dbresponse));
    if (dbresponse.success) {
      response = {
        success: true,
        message: 'all assets confirmed',
        assets: userSerialNumbers
      }
      res.json(response)
      return;
    }
  }

  response = {
    "success": false,
    "message": dbresponse.message,
  }
  res.status(401)
  res.json(response)
});

router.post('/findallAssetRequest', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await myAssetRdb.findAllAssetRequest(id, limit)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    response = {
      success: true,
      message: "user find Successfully",
      requests: dbresponse.requests
    }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});

router.post('/findallConfirmedRequest', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await myAssetRdb.findConfirmedAssetRequest(id, limit)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    response = {
      success: true,
      message: "user find Successfully",
      requests: dbresponse.requests
    }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});

router.post('/findallNotConfirmedRequest', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await myAssetRdb.findNotConfirmedAssetRequest(id, limit)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    response = {
      success: true,
      message: "user find Successfully",
      requests: dbresponse.requests
    }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});

router.post('/findallAsset', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await assetDb.findAllAsset(id, limit)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    response = {
      success: true,
      message: "assets find Successfully",
      requests: dbresponse.requests
    }
  }
  else {
    res.status(401)
  }

  res.json(dbresponse)
});



router.post('/adminGenerateMicroToken', async function (req, res) {
  try {
    var token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + serverConfig.jwtExpireTimeForMicro,
      username: "AdminConfirmMicro",
      orgName: "AdminConfirmMicro",
      accountNumber: "AdminConfirmMicro",
      userType: "Micro"
    }, serverConfig.jwtSecret);
    var response = {
      success: true,
      message: "token generate Successfully",
      token: token
    }
    res.send(response);
  }
  catch (err) {
    var response = {
      success: false,
      message: "an error happend ..."
    }
    res.send(response);
  }

});

router.post('/findAllMicroAsset', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await assetDb.findAllMicroAsset(id, limit)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    // response = {
    //   success : true ,
    //   message : "assets find Successfully" ,
    //   assets : dbresponse.requests
    // }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});


router.post('/findAssignedMicroAsset', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await assetDb.findAssignedMicroAsset(id, limit)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    // response = {
    //   success : true ,
    //   message : "assets find Successfully" ,
    //   assets : dbresponse.requests
    // }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});



router.post('/findNotInitMicroAsset', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await assetDb.findNotInitMicroAsset(id, limit)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    // response = {
    //   success : true ,
    //   message : "assets find Successfully" ,
    //   assets : dbresponse.requests
    // }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});


router.post('/findInitNotAssignedMicroAsset', async function (req, res) {
  var response = '';
  var id = req.body.next;
  var limit = req.body.limit ? req.body.limit : 30
  var dbresponse = await assetDb.findInitNotAssignedMicroAsset(id, limit)
  console.log(JSON.stringify(dbresponse));
  if (dbresponse.success) {
    // response = {
    //   success : true ,
    //   message : "assets find Successfully" ,
    //   assets : dbresponse.requests
    // }
  }
  else {
    response = {
      "success": false,
      "message": dbresponse.message,
    }
    res.status(401)
  }

  res.json(dbresponse)
});


module.exports = router;
