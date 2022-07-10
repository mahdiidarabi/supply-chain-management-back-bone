
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('MainApp');

var http = require('http');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var util = require('util');
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');




//------------------ Server Config ----------------------
require('./config.js');
var serverConfig = require('./config-server.js') ;
var host = serverConfig.host;
var port = serverConfig.httpPort;

//--------------------- Define Route ----------------------------
var adminRoute = require('./route/adminRoute.js');
var userRoute = require('./route/userRoute.js');
var fabricRoute = require('./route/fabricRoute.js');
var generalRoute = require('./route/generalRoute.js');
var microRoute = require('./route/microRoute.js') ;
var queryRoute = require('./route/queryRoute.js') ;

//---------------------- Create App -----------------------

var app = express();
app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

//---------------------- Token Function ----------------------
app.set('secret', serverConfig.jwtSecret);
app.use(expressJWT({
  secret: serverConfig.jwtSecret
}).unless({
  path: [/\/general\//i ,]
}));
app.use(bearerToken());



app.use(function (req, res, next) {
  logger.debug(' ------>>>>>> new request for %s', req.originalUrl);

  if (req.originalUrl.indexOf('/general') >= 0) {
    return next();
  }

  var token = req.token;
  jwt.verify(token, app.get('secret'), function (err, decoded) {
    if (err) {
      res.send({
        success: false,
        message: 'Failed to authenticate token. Make sure to include the ' +
                 'token returned from /users call in the authorization header ' +
                 ' as a Bearer token'
      });
      return;
    } else {
      if (decoded.userType === 'Micro') {
        req.microId = decoded.microId;
        req.serialNumber = decoded.serialNumber;
        logger.debug(util.format('Decoded from JWT token: microId - %s ', decoded.microId));
      }
      else {
        req.username = decoded.username;
        req.accountNumber = decoded.accountNumber;
        logger.debug(util.format('Decoded from JWT token: username - %s', decoded.username));
      }
      req.userType = decoded.userType;
      req.orgname = decoded.orgName;
      return next();
    }
  });
});


//------------------------- Route --------------------------

app.use('/api/admin', adminRoute);
app.use('/api/user', userRoute);
app.use('/api/fabric', fabricRoute);
app.use('/api/general', generalRoute);
app.use('/api/micro', microRoute);
app.use('/api/query', queryRoute);

// -------------------- Create Server --------------------------

var httpServer = http.createServer(app);
// var httpsServer = https.createServer(config.credentials, app);

httpServer.listen(port);
// httpsServer.listen(config.httpsPort);

httpServer.timeout = 240000;
// httpsServer.timeout = 240000;

logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************', host, port);
// logger.info('***************  https://%s:%s  ******************', serverConfig.host, serverConfig.httpsPort);

// ---------------------- Test Route For Check Token ----------------------

app.post('/api/test', async function(req, res) {
  
  if(req.userType == 'Micro') {
    console.log(JSON.stringify(req.microId)) ;
    var response = {
      success: true,
      message: "server response for micro successfully",
      microId : req.microId,
      orgname : req.orgname,
      serialNumber: req.serialNumber,
	    userType: req.userType
    }
  }
  else {
    console.log(JSON.stringify(req.username)) ;
    var response = {
      success: true,
      message: "server response for user successfully",
      username : req.username,
      orgname : req.orgname,
      accountNumber: req.accountNumber,
	    userType: req.userType
    }
  }
  res.json(response)
});
