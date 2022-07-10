const Pool = require('pg').Pool
var config = require('../config-database.js');

//------------------------------------Admin--------------------------------------------
async function requestAsset(accountNumber,assetsCount,isMicroRequested) {
  const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })
  var response ;
  const request_asset = 'INSERT INTO requested_asset_list(account_number,assets_count,is_micro_requested) VALUES($1,$2,$3) RETURNING *';
  var request = [accountNumber, assetsCount, isMicroRequested]
  pool.query(request_asset, request, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'request asset database error',
     }
      console.log('----------------------------------------');
      console.log(JSON.stringify(error));
    }
    else{
      response = {
       "success": true,
       "message": "successfuly add request for assets ",
       "requestId" : results.rows[0].id
     }
     console.log('request asset');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function findAssetrequestById(requestId) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const request_find = 'SELECT * FROM requested_asset_list WHERE id = $1';
  var request = [requestId]  ;
  var response = '' ;
  pool.query(request_find, request, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database Error',
     }
      console.log('--------------------findAssetrequestByHolder Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
      if (results.rowCount > 0 ){
        request = results.rows[0]
        response = {
         "success": true,
         "message": "Successfully got request for this requestId",
         "request" : request
       }
      }
      else {
       response = {
        "success": false,
        "message": "no request for this Id found",
      }
    }

     console.log('---------------- findAssetrequestByHolder Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function findAllAssetRequest(id,limit = 30) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  var request_find ; 
  var arguman ;
  if (id){
    request_find = 'SELECT * FROM requested_asset_list WHERE id < $1 ORDER BY id DESC LIMIT $2';
    arguman = [id,limit]
  }
  else{
    request_find = 'SELECT * FROM requested_asset_list ORDER BY id DESC LIMIT $1';
    arguman = [limit]
  }
  var response = '' ;
  pool.query(request_find,arguman, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database Error',
     }
      console.log('-------------------- Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
      if (results.rowCount > 0 ){
        var requests = results.rows
        response = {
         "success": true,
         "message": "get assets request Successfully ",
         "requestCount" : results.rowCount,
         "requests" : requests,
         "next" : requests[results.rowCount -1].id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no Asset request found",
      }
    }

     console.log('---------------- Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function findConfirmedAssetRequest(id,limit = 30) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  var request_find ; 
  var arguman ;
  if (id){
    request_find = 'SELECT * FROM requested_asset_list WHERE is_request_ended = true AND id < $1 ORDER BY id DESC LIMIT $2';
    arguman = [id,limit]
  }
  else{
    request_find = 'SELECT * FROM requested_asset_list WHERE is_request_ended = true ORDER BY id DESC LIMIT $1';
    arguman = [limit]
  }

  var response = '' ;
  pool.query(request_find,arguman, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database Error',
     }
      console.log('--------------------Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
      if (results.rowCount > 0 ){
        var requests = results.rows
        response = {
          "success": true,
          "message": "get assets request Successfully",
          "requestsCount" : results.rowCount,
          "requests" : requests,
          "next" : requests[results.rowCount -1].id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no Asset request found",
      }
    }

     console.log('----------------Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function findNotConfirmedAssetRequest(id,limit = 30) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  var request_find ; 
  var arguman ;
  if (id){
    request_find = 'SELECT * FROM requested_asset_list WHERE is_request_ended=false AND id < $1 ORDER BY id DESC LIMIT $2';
    arguman = [id,limit]
  }
  else{
    request_find = 'SELECT * FROM requested_asset_list WHERE is_request_ended=false ORDER BY id DESC LIMIT $1';
    arguman = [limit]
  }
  
  var response = '' ;
  pool.query(request_find,arguman, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database Error',
     }
      console.log('--------------------Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
      if (results.rowCount > 0 ){
        var requests = results.rows
        response = {
          "success": true,
          "message": "get assets request Successfully",
          "requestsCount" : results.rowCount,
          "requests" : requests,
          "next" : requests[results.rowCount -1].id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no request found",
      }
    }

     console.log('---------------- Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function adminConfirmAssetRequest(requestId,confirmedAssetsCount,isRequestEnded) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const request_confirm = 'UPDATE requested_asset_list SET is_request_ended = $3 ,confirmed_assets_count = $2 , lastChecked_on = NOW() WHERE id = $1;';
  var request =[requestId,confirmedAssetsCount,isRequestEnded]
  var response = '' ;
  pool.query(request_confirm,request , (error, results) => {
    if (error) {
        response = {
         "success": false,
         "message": ' database Error',
       }

      console.log('--------------------Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
		if (results.rowCount > 0 ){
        users = results.rows
			response = {
			  "success": true,
			  "message": "confirm request Successfully ",
			}
		}
		else {
			response = {
			"success": false,
			"message": "request_id not found",
			}
		}
		console.log('---------------- Response -----------------');
		console.log(JSON.stringify(results));
	}
  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

//----------------------user--------------------------------------------------
async function findAllAssetrequestByHolder(accountNumber,id,limit = 30) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  var request_find ; 
  var arguman ;
  if (id){
    request_find = 'SELECT * FROM requested_asset_list WHERE account_number = $1 AND id < $2 ORDER BY id DESC LIMIT $3';
    arguman = [accountNumber,id,limit]
  }
  else{
    request_find = 'SELECT * FROM requested_asset_list WHERE account_number = $1 ORDER BY id DESC LIMIT $2';
    arguman = [accountNumber,limit]
  }
  
  var response = '' ;
  pool.query(request_find, arguman, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database Error',
     }
      console.log('--------------------findAssetrequestByHolder Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
      if (results.rowCount > 0 ){
        request = results.rows
        response = {
         "success": true,
         "message": "Successfully got request for assets",
         "requestsCount" : results.rowCount,
         "requests" : request,
         "next" : request[results.rowCount -1].id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no request for asset found",
      }
    }

     console.log('---------------- findAssetrequestByHolder Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}
async function findConfirmedAssetrequestByHolder(accountNumber,id,limit = 30) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })
  
  var request_find ; 
  var arguman ;
  if (id){
    request_find = 'SELECT * FROM requested_asset_list WHERE account_number = $1 AND is_request_ended = true AND id < $2 ORDER BY id DESC LIMIT $3';
    arguman = [accountNumber,id,limit]
  }
  else{
    request_find = 'SELECT * FROM requested_asset_list WHERE account_number = $1 AND is_request_ended = true ORDER BY id DESC LIMIT $2';
    arguman = [accountNumber,limit]
  }

  var response = '' ;
  pool.query(request_find, arguman, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database Error',
     }
      console.log('--------------------findAssetrequestByHolder Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
      if (results.rowCount > 0 ){
        request = results.rows
        response = {
         "success": true,
         "message": "Successfully got request for assets",
         "requestsCount" : results.rowCount,
         "requests" : request,
         "next" : request[results.rowCount -1].id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no request for asset found",
      }
    }

     console.log('---------------- findAssetrequestByHolder Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}
async function findNotConfirmedAssetrequestByHolder(accountNumber,id,limit = 30) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })
  
  var request_find ; 
  var arguman ;
  if (id){
    request_find = 'SELECT * FROM requested_asset_list WHERE account_number = $1 AND is_request_ended = false AND id < $2 ORDER BY id DESC LIMIT $3';
    arguman = [accountNumber,id,limit]
  }
  else{
    request_find = 'SELECT * FROM requested_asset_list WHERE account_number = $1 AND is_request_ended = false ORDER BY id DESC LIMIT $2';
    arguman = [accountNumber,limit]
  }
  
  var response = '' ;
  pool.query(request_find, arguman, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database Error',
     }
      console.log('--------------------findAssetrequestByHolder Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
      if (results.rowCount > 0 ){
        request = results.rows
        response = {
         "success": true,
         "message": "Successfully got request for assets",
         "requestsCount" : results.rowCount,
         "requests" : request,
         "next" : request[results.rowCount -1].id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no request for asset found",
      }
    }

     console.log('---------------- findAssetrequestByHolder Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

 exports.requestAsset = requestAsset;
 exports.findAssetrequestById = findAssetrequestById;
 exports.findAllAssetRequest = findAllAssetRequest;
 exports.findConfirmedAssetRequest = findConfirmedAssetRequest;
 exports.findNotConfirmedAssetRequest = findNotConfirmedAssetRequest;
 exports.adminConfirmAssetRequest = adminConfirmAssetRequest;
 exports.findAllAssetrequestByHolder = findAllAssetrequestByHolder;
 exports.findConfirmedAssetrequestByHolder = findConfirmedAssetrequestByHolder;
 exports.findNotConfirmedAssetrequestByHolder = findNotConfirmedAssetrequestByHolder;
