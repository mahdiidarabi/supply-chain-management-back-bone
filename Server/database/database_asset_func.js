const Pool = require('pg').Pool
var config = require('../config-database.js');
var bcrypt = require('bcrypt');
//------------------------requestId,serialNumber,firstHolder,isMicroAssigned,microId,microServerIp--------------------------------------------------------
async function addAsset(requestId,serialNumber,firstHolder,isMicroAssigned,microId,microServerIp) {
  const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })
  var response ;
  const add_asset = 'INSERT INTO asset_list(request_id,serial_number,first_holder,current_holder,is_micro_assigned,micro_id,micro_server_ip) VALUES($1,$2,$3,$3,$4,$5,$6) RETURNING *';
  var asset = [requestId,serialNumber,firstHolder,isMicroAssigned,microId,microServerIp]
  pool.query(add_asset, asset, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database error',
     }
      console.log('----------------------------------------');
      console.log(JSON.stringify(error));
    }
    else{
      response = {
       "success": true,
       "message": "successfuly add asset to database ",
     }
     console.log('add asset');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}


async function startAsset(serialNumber,firstHolder) {
  const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })
  var response ;
  const start_asset = 'UPDATE asset_list SET start_on = NOW()  WHERE serial_number = $1 and first_holder = $2 RETURNING *';
  var asset = [serialNumber,firstHolder]
  pool.query(start_asset, asset, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database error',
     }
      console.log('----------------------------------------');
      console.log(JSON.stringify(error));
    }
    else{
      response = {
       "success": true,
       "message": "successfuly add asset to blockchain ",
     }
     console.log('start asset ');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}



async function microLogin(microId , password) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

    const user_find = 'SELECT * FROM asset_list WHERE micro_id = $1 ';
    var user = [microId]  ;
    var response = '' ;
    pool.query(user_find, user, (error, results) => {
        if (error) {
            response = {
                "success": false,
                "message": 'findUser database Error',
            }
            console.log('--------------------find user Error --------------------');
            console.log(JSON.stringify(error));
        }
        else{
            if (results.rowCount > 0 ){
                var micro = results.rows[0] ;
                if(password == micro.micro_password) {
                  response = {
                    "success": true,
                    "message": "db successful ",
                    "micro" : micro
                  }
            
                } else {
                  response = {
                    "success": false,
                    "message": "username or password is incorrect",
                  }
                }
              }
              else{
                response = {
                    "success": false,
                    "message": "username or password is incorrect",
                }
              }

            console.log('---------------- find User Response -----------------');
            console.log(JSON.stringify(results));
        }

    });

    await pool.end() ;
    console.log('pool connection closed ');
    return response ;
}

async function microSetPass(microId,password) {
  const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })
  var response ;
  const start_micro = 'UPDATE asset_list SET micro_password = $2  WHERE micro_id = $1 and micro_password is null RETURNING *';
  var micro = [microId,password]
  pool.query(start_micro, micro, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database error',
     }
      console.log('----------------------------------------');
      console.log(JSON.stringify(error));
    }
    else{
      response = {
       "success": true,
       "message": "successfuly add micro password ",
     }
     console.log(' micro login ');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function microLoginTime(microId) {
  const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })
  var response ;
  const start_micro = 'UPDATE asset_list SET micro_last_login = NOW()  WHERE micro_id = $1  RETURNING *';
  var micro = [microId]
  pool.query(start_micro, micro, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database error',
     }
      console.log('----------------------------------------');
      console.log(JSON.stringify(error));
    }
    else{
      response = {
       "success": true,
       "message": "successfuly add micro login time ",
     }
     console.log(' micro login ');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function findUserAssetsByRequestId(accountNumber,assetRequestId) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const assets_find = 'SELECT * FROM asset_list WHERE request_id = $1 AND first_holder=$2';
  var asset = [assetRequestId,accountNumber]  ;
  var response = '' ;
  pool.query(assets_find, asset, (error, results) => {
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
        var assets = results.rows
        response = {
         "success": true,
         "message": "Successfully load assets",
         "assetCount" : results.rowCount,
         "assets" : assets
       }
      }
      else {
       response = {
        "success": false,
        "message": "no  asset found",
      }
    }

     console.log('----------------  Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function findAssetByFirstHolder(firstHolder,id,limit = 30) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })
  
  var assets_find ; 
  var arguman ;
  if (id){
    assets_find = 'SELECT * FROM asset_list WHERE first_holder = $1 AND number < $2 ORDER BY number DESC LIMIT $3';
    arguman = [firstHolder,id,limit]
  }
  else{
    assets_find = 'SELECT * FROM asset_list WHERE first_holder = $1 ORDER BY number DESC LIMIT $2';
    arguman = [firstHolder,limit]
  }

  var response = '' ;
  pool.query(assets_find, arguman, (error, results) => {
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
        var assets = results.rows
        response = {
         "success": true,
         "message": "Successfully load assets",
         "assetCount" : results.rowCount,
         "assets" : assets,
         "next" : assets[results.rowCount -1].number
       }
      }
      else {
       response = {
        "success": false,
        "message": "no  asset found",
      }
    }

     console.log('----------------  Response -----------------');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function findAllAsset(id,limit = 30) {
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
    request_find = 'SELECT * FROM asset_list WHERE  number < $1 ORDER BY number DESC LIMIT $2';
    arguman = [id,limit]
  }
  else{
    request_find = 'SELECT * FROM asset_list ORDER BY number DESC LIMIT $1';
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
        var assets = results.rows
        response = {
         "success": true,
         "message": "get assets  Successfully ",
         "assetCount" : results.rowCount,
         "assets" : assets,
         "next" : assets[results.rowCount -1].number
       }
      }
      else {
       response = {
        "success": false,
        "message": "no Asset found",
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

async function findAssetsOnlyByMicroId(microId) {
  const pool = new Pool({
    user: config.dbUser,
    host: config.dbHost,
    database: config.dbName,
    password: config.dbPassword,
    port: config.dbPort,
  });
  const assets_find = 'SELECT * FROM asset_list WHERE micro_id = $1';
  var asset = [microId];
  var response = '';
  pool.query(assets_find, asset, (error, results) => {
    if (error) {
      response = {
        "success": false,
        "message": 'database, find asset only by micro Id get error',
      };
      console.log('-------------------- DB Error --------------------');
      console.log(JSON.stringify(error));
    }
    else {
      if (results.rowCount > 0) {
        var assets = results.rows;
        response = {
          "success": true,
          "message": "Successfully load assets",
          "assetCount": results.rowCount,
          "assets": assets
        };
      }
      else {
        response = {
          "success": false,
          "message": "no  asset found",
        };
      }
      console.log('----------------  Response -----------------');
      console.log(JSON.stringify(results));
    }
  });
  await pool.end();
  console.log('pool connection closed ');
  return response;
}

// !
async function userChangeHolder(serial_number,newHolder,preHolder) {
  const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })
  var response ;
  const start_micro = 'UPDATE asset_list SET current_holder = $2  WHERE serial_number = $1 and current_holder = $3 ';
  var micro = [serial_number,newHolder,preHolder]
  pool.query(start_micro, micro, (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'database error',
     }
      console.log('----------------------------------------');
      console.log(JSON.stringify(error));
    }
    else{
      response = {
       "success": true,
       "message": "successfuly add micro holder ",
     }
     console.log(' micro login ');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}





exports.addAsset = addAsset;
exports.startAsset = startAsset
exports.findUserAssetsByRequestId = findUserAssetsByRequestId;
exports.findAssetByFirstHolder = findAssetByFirstHolder;
exports.findAllAsset = findAllAsset;
exports.findAssetsOnlyByMicroId = findAssetsOnlyByMicroId;
exports.microSetPass = microSetPass ;
exports.microLoginTime = microLoginTime;
exports.microLogin = microLogin ;
exports.userChangeHolder = userChangeHolder;