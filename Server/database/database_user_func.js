const Pool = require('pg').Pool
var config = require('../config-database.js');
var bcrypt = require('bcrypt');
//--------------------------------------------------------------------------------
async function addUser(username, password, email, name, familyname ,userType) {
  const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })
  var response ;
  const add_user = 'INSERT INTO user_list(username,password,email,name,familyname,user_type) VALUES($1,$2,$3,$4,$5,$6) RETURNING *';
  var passHash  = bcrypt.hashSync(password, 10);
  var user = [username, passHash, email, name, familyname , userType]
  pool.query(add_user, user, (error, results) => {
    if (error) {
      var message ;
      if (error.code == 23505){
        if (error.constraint == 'user_list_username_key' ){
          message = 'username exist'
        }
        if (error.constraint == 'user_list_email_key' ){
          message = 'email exist'
        }

      }
      else{
        message = "db error"
      }

      response = {
       "success": false,
       "message": message,
     }
      console.log('----------------------------------------');
      console.log(JSON.stringify(error));
    }
    else{
      response = {
       "success": true,
       "message": "db successful ",
     }
     console.log('add');
     console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');

  return response ;
}

async function findUserByUsername(username) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const user_find = 'SELECT * FROM user_list WHERE username = $1';
  var user = [username]  ;
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
        user = results.rows[0]
        response = {
         "success": true,
         "message": "db successful ",
         "user" : user
       }
      }
      else {
       response = {
        "success": false,
        "message": "user not found",
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

async function findUserByAccountNumber(accountNumber) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const user_find = 'SELECT username,name,familyname FROM user_list WHERE account_number = $1';
  var user = [accountNumber]  ;
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
        user = results.rows[0]
        response = {
         "success": true,
         "message": "db successful ",
         "user" : user
       }
      }
      else {
       response = {
        "success": false,
        "message": "user not found",
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

async function checkUsernamePassword(username , password) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

    const user_find = 'SELECT * FROM user_list WHERE username = $1';
    var user = [username]  ;
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
                user = results.rows[0] ;
                if(bcrypt.compareSync(password, user.password)) {
                  console.log(user.isconfirmed)
                  if ( user.isconfirmed == null ){
                    response = {
                      "success": false,
                      "message": "user not Confirmed",
                    }
                  }
                  else if ( user.isconfirmed){
                    response = {
                      "success": true,
                      "message": "db successful ",
                      "user" : user
                    }
                  }
                  else {
                    response = {
                      "success": false,
                      "message": "user Rejected",
                    }
                  }
                } else {

                }
              }
              else{
                response = {
                    "success": false,
                    "message": "username or pasword is incorrect",
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

async function findAllUser(id,limit = 10) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  var user_find
  var arguman 
  if (id){
    user_find = 'SELECT * FROM user_list WHERE user_id < $1 ORDER BY user_id DESC LIMIT $2';
    arguman = [id,limit]
  }
  else{
    user_find = 'SELECT * FROM user_list ORDER BY user_id DESC LIMIT $1 ';
    arguman = [limit]
  }
  var response = '' ;
  pool.query(user_find,arguman, (error, results) => {
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
        users = results.rows
        response = {
         "success": true,
         "message": "get users Successfully ",
         "usersCount" : results.rowCount,
         "users" : users,
         "next" : users[results.rowCount-1].user_id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no user found",
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

async function findConfirmedUser(id,limit = 10) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  var user_find
  var arguman 
  if (id){
    user_find = 'SELECT * FROM user_list WHERE isConfirmed = true And user_id < $1 ORDER BY user_id DESC LIMIT $2';
    arguman = [id,limit]
  }
  else{
    user_find = 'SELECT * FROM user_list WHERE isConfirmed = true  ORDER BY user_id DESC LIMIT $1 ';
    arguman = [limit]
  }
  var response = '' ;
  pool.query(user_find,arguman, (error, results) => {
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
        users = results.rows
        response = {
         "success": true,
         "message": "get users Successfully ",
         "usersCount" : results.rowCount,
         "users" : users,
         "next" : users[results.rowCount-1].user_id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no user found",
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

async function findRejectedUser(id,limit = 10) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  var user_find
  var arguman 
  if (id){
    user_find = 'SELECT * FROM user_list WHERE isConfirmed = false AND user_id < $1 ORDER BY user_id DESC LIMIT $2';
    arguman = [id,limit]
  }
  else{
    user_find = 'SELECT * FROM user_list WHERE isConfirmed = false ORDER BY user_id DESC LIMIT $1 ';
    arguman = [limit]
  }
  var response = '' ;
  pool.query(user_find,arguman, (error, results) => {
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
        users = results.rows
        response = {
         "success": true,
         "message": "get users Successfully ",
         "usersCount" : results.rowCount,
         "users" : users,
         "next" : users[results.rowCount-1].user_id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no user found",
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

async function findNotseenUser(id,limit = 10) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  var user_find
  var arguman 
  if (id){
    user_find = 'SELECT * FROM user_list WHERE isConfirmed IS NULL AND user_id < $1 ORDER BY user_id DESC LIMIT $2';
    arguman = [id,limit]
  }
  else{
    user_find = 'SELECT * FROM user_list WHERE isConfirmed IS NULL ORDER BY user_id DESC LIMIT $1 ';
    arguman = [limit]
  }
  var response = '' ;
  pool.query(user_find,arguman, (error, results) => {
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
        users = results.rows
        response = {
         "success": true,
         "message": "get users Successfully ",
         "usersCount" : results.rowCount,
         "users" : users,
         "next" : users[results.rowCount-1].user_id
       }
      }
      else {
       response = {
        "success": false,
        "message": "no user found",
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

async function adminConfirmUser(username,isAdmin) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const user_confirm = 'UPDATE user_list SET isConfirmed = true,isAdmin = $2  WHERE username = $1;';
  var user =[username,isAdmin]
  var response = '' ;
  pool.query(user_confirm,user , (error, results) => {
    if (error) {
        response = {
         "success": false,
         "message": ' database Error',
       }

      console.log('--------------------confirm user Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
		if (results.rowCount > 0 ){
        users = results.rows
			response = {
			  "success": true,
			  "message": "confirm users Successfully ",
			}
		}
		else {
			response = {
			"success": false,
			"message": "user not found",
			}
		}
		console.log('---------------- confirm User Response -----------------');
		console.log(JSON.stringify(results));
	}
  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function adminRejectUser(username) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const user_reject = 'UPDATE user_list SET isConfirmed = false  WHERE username = $1';
  var user =[username]
  var response = '' ;
  pool.query(user_reject,user , (error, results) => {
    if (error) {
      response = {
       "success": false,
       "message": 'reject database Error',
     }
      console.log('--------------------find user Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
        if (results.rowCount > 0 ){
        users = results.rows
			response = {
			  "success": true,
			  "message": " reject user Successfully ",
			}
		}
		else {
			response = {
			"success": false,
			"message": "user not found",
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

async function adminSetAccountnumber(username,accountNumber) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const setAccountnumber = 'UPDATE user_list SET account_number = $2  WHERE username = $1 AND ( account_number IS NULL OR isConfirmed IS NULL);';
  var user =[username , accountNumber ]
  var response = '' ;
  pool.query(setAccountnumber,user , (error, results) => {
    if (error) {
      if (error.code == 23505){
        response = {
         "success": false,
         "message": 'account number exsit',
       }
      }
      else {
        response = {
         "success": false,
         "message": 'database Error',
       }
      }
      console.log('--------------------db Error --------------------');
      console.log(JSON.stringify(error));
    }
    else{
        if (results.rowCount > 0 ){
			       response = {
			            "success": true,
			            "message": "Account number set Successfully ",
			       }
		    }
		else {
			response = {
			"success": false,
			"message": "user not found or account number set before",
			}

		}

		console.log('---------------- add accunt number Response -----------------');
		console.log(JSON.stringify(results));
    }

  });

  await pool.end() ;
  console.log('pool connection closed ');
  return response ;
}

async function addLoginTime(username) {
  const pool = new Pool({
   user: config.dbUser,
   host: config.dbHost,
   database: config.dbName,
   password: config.dbPassword,
   port: config.dbPort,
 })

  const user_reject = 'UPDATE user_list SET last_login = NOW()  WHERE username = $1';
  var user =[username]
  var response = '' ;
  pool.query(user_reject,user , (error, results) => {
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
			response = {
			  "success": true,
			  "message": " last_login set Successfully ",
			}
		}
		else {
			response = {
			"success": false,
			"message": "user not found",
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

 exports.addUser = addUser;
 exports.findUserByUsername = findUserByUsername;
 exports.findAllUser = findAllUser;
 exports.findConfirmedUser = findConfirmedUser;
 exports.findRejectedUser = findRejectedUser;
 exports.findNotseenUser = findNotseenUser;
 exports.adminConfirmUser = adminConfirmUser;
 exports.adminRejectUser = adminRejectUser;
 exports.adminSetAccountnumber = adminSetAccountnumber;
 exports.checkUsernamePassword =checkUsernamePassword ;
 exports.addLoginTime =addLoginTime ;
