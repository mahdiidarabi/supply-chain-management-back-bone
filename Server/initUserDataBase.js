const Pool = require('pg').Pool
var config = require('./config-database.js');
var bcrypt = require('bcrypt');


const create_table =
`CREATE TABLE IF NOT EXISTS user_list(
  user_id serial PRIMARY KEY,
  account_number BIGINT UNIQUE,
  username VARCHAR (50) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email VARCHAR (355) UNIQUE NOT NULL,
  name VARCHAR (50)  ,
  familyname VARCHAR (50) ,
  user_type VARCHAR (50) default 'source',
  isConfirmed BOOLEAN ,
  isAdmin BOOLEAN default false,
  created_on TIMESTAMP default CURRENT_TIMESTAMP,
  last_login TIMESTAMP)`;

const drop_table = 'DROP TABLE IF EXISTS user_list';

const add_admin = 'INSERT INTO user_list(account_number,username,password,email,name,familyname,isConfirmed,isAdmin,user_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *';
var admin1_passHash  = bcrypt.hashSync('admin1pass', 10);
var admin2_passHash  = bcrypt.hashSync('admin2pass', 10);
var admin_user1 = [1111111111 , 'Admin1', admin1_passHash, 'admin1@email.com', 'Admin1N', 'Admin1F',true,true,'admin1']
var admin_user2 = [2222222222 , 'Admin2', admin2_passHash, 'admin2@email.com', 'Admin2N', 'Admin2F',true,true,'admin1']


 async function sina(action,org = 1) {

   const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })

   switch(action) {
     case 'drop':{
       pool.query(drop_table, (error, results) => {
         if (error) {
           console.log('----------------------------------------');
           console.log(JSON.stringify(error));
           throw error
         }
         console.log('drop user table');
         console.log(JSON.stringify(results));
       });
     }
       // code block
       break;
     case 'create':{
       pool.query(create_table, (error, results) => {
         if (error) {
           console.log('----------------------------------------');
           console.log(JSON.stringify(error));
           throw error
         }
         console.log('create user table');
         console.log(JSON.stringify(results));
       });
     }
       // code block
       break;
	 case 'admin':{
      var myAdmin = (org == 1) ? admin_user1 : admin_user2 ;
       pool.query(add_admin, myAdmin, (error, results) => {
         if (error) {
           console.log('----------------------------------------');
           console.log(JSON.stringify(error));
           throw error
         }
         console.log('add admin for Org' + org);
         console.log(JSON.stringify(results));
       });
     }
      break;
     default:
       // code block
   }
   await pool.end()
}

start = async (action,org) => {
  console.log('log is ' + action);
  await sina(action,org) ;
}


start(process.argv[2],process.argv[3])
