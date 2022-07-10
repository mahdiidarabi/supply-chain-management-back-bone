//-------------------- General  router -----------------------

var jwt = require('jsonwebtoken');
var express = require('express');
var router = express.Router() ;

// --------------------- DataBase -------------------------
var mydb = require('../database/database_user_func.js') ;
var assetDb = require('../database/database_asset_func.js') ;

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
  console.log('------------------------------ Insid general -----------------------' );
  return next();
}) ;

// --------------- Start Route ---------------------------

router.post('/register', async function(req, res) {
  var response ;
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var name = req.body.name;
  var familyname = req.body.familyname;
  var userType = req.body.userType ? req.body.userType : 'source' ;

  if (!username) {
    res.json(getErrorMessage('\'username\''));
    return;
  }
  if (!password) {
    res.json(getErrorMessage('\'password\''));
    return;
  }
  if (!email) {
    res.json(getErrorMessage('\'email\''));
    return;
  }
  if (!name) {
    res.json(getErrorMessage('\'name\''));
    return;
  }
  if (!familyname) {
    res.json(getErrorMessage('\'familyname\''));
    return;
  }
  if (!(userType == 'source' || userType == 'supplier' || userType == 'enduser' || userType == 'admin1' || userType == 'admin2')) {
    res.json(getErrorMessage('\'userType\''));
    return;
  }

  var dbresponse = await mydb.addUser(username, password, email, name, familyname, userType)
  if (dbresponse.success){
  response = {
    "success": true,
    "message": "register successful ",
  }
  }
  else{
  response = {
    "success": false,
    "message": dbresponse.message,
  }
  res.status(406)
  }
  res.json(response)
});

router.post('/login', async function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  
  // ! below is just for test
  var orgName =  req.body.orgName ? req.body.orgName : 'Org1' ;

  var  dbresponse = await mydb.checkUsernamePassword(username,password)
  var response = '';

  if (dbresponse.success) {
    var  dbresponse1 = await mydb.addLoginTime(username) ;
    user = dbresponse.user ;
    var token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + serverConfig.jwtExpireTime,
      username: username,
	    orgName: orgName,
      accountNumber: user.account_number,
      userType: user.user_type
    }, serverConfig.jwtSecret);

    var response = {
      "success": true,
      "message": "user login Successfully",
      "username": username,
	    "accountNumber" : user.account_number ,
	    "userType" : user.user_type ,
      "token": token
    }
    res.json(response)
  } else {
    console.log({
      username,
      password
    })
    var response = {
      "success": 'false',
      "message": dbresponse.message,
      "username": username,
    }
    res.json(response)
  }

});

router.post('/loginMicro',async function(req, res){
	try {
    console.log('at beggining of of loginMicro api');

    var microId = req.body.microId;
    var password = req.body.password;
    var orgName = req.body.orgname ? req.body.orgname : 'Org1';

    console.log('loading body of request in moginMicro api');

    var dbResponse = await assetDb.findAssetsOnlyByMicroId(microId);
    var serialNumber = dbResponse.assets[0].serial_number;
    console.log('request (findAssetsOnlyByMicroId) to asset data base in loginMicro api') ;
    if (dbResponse.assetCount != 1){
      var response = {
        "success": false,
        "message": 'There is more than a micro with this Id',
      }
       res.send(response) ;
       return ;
    }
    else {
      if (dbResponse.assets[0].micro_password) {
        var dbResponseLoginCheck = await assetDb.microLogin(microId, password);
        console.log('request (microLogin) to asset data base in loginMicro api') ;
        if (!dbResponseLoginCheck.success) {
          var response = {
            "success": false,
            "message": 'can not login for micro',
          }
           res.send(response) ;
           return ;
        }
        else {
          var dbResponseLoginTime = await assetDb.microLoginTime(microId);
          console.log('request (microLoginTime) to asset data base in loginMicro api') ;
          var token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + serverConfig.jwtExpireTime,
            microId: microId,
            serialNumber: serialNumber,
            orgName: orgName,
            userType: "Micro"
          }, serverConfig.jwtSecret);
      
          var response = {
            "success": true,
            "message": "micro login Successfully",
            "microId": microId,
            "serialNumber" : serialNumber ,
            "userType" : "Micro" ,
            "token": token
          }
          res.send(response) ;
          return ;
        }
      }
      else {
        var dbResponseSetPass = await assetDb.microSetPass(microId, password);
        console.log('request (microSetPass) to asset data base in loginMicro api') ;
        if (!dbResponseSetPass.success) {
          var response = {
            "success": false,
            "message": 'can not set password for micro',
          }
           res.send(response) ;
           return ;
        }
        else {
          var dbResponseLoginTime = await assetDb.microLoginTime(microId);
          console.log('request (microLoginTime) to asset data base in loginMicro api') ;
          var token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + serverConfig.jwtExpireTime,
            microId: microId,
            serialNumber: serialNumber,
            orgName: orgName,
            userType: "Micro"
          }, serverConfig.jwtSecret);
      
          var response = {
            "success": true,
            "message": "micro login Successfully",
            "microId": microId,
            "serialNumber" : serialNumber ,
            "userType" : "Micro" ,
            "token": token
          }
          res.send(response) ;
          return ;
        }


      }
    }
    
	}
	catch(err){
		var response = {
		 "success": false,
		 "message": 'Micro login was failed',
	   }
		res.send(response) ;
	}
});

module.exports = router
