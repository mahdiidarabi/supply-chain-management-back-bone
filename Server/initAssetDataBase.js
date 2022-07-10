const Pool = require('pg').Pool
var config = require('./config-database.js');



const create_RequestedAssetTable =
`CREATE TABLE IF NOT EXISTS requested_asset_list(
  id serial PRIMARY KEY,
  account_number BIGINT NOT NULL ,
  assets_count INT NOT NULL,
  is_micro_requested BOOLEAN default false,
  request_on TIMESTAMP default CURRENT_TIMESTAMP,
  confirmed_assets_count INT default 0 ,
  is_request_ended BOOLEAN default false  ,
  lastChecked_on TIMESTAMP
)`;
const create_AssetTable =
`CREATE TABLE IF NOT EXISTS asset_list(
  number serial PRIMARY KEY,
  request_id INT,
  serial_number BIGINT UNIQUE,
  first_holder BIGINT,
  current_holder BIGINT,
  is_micro_assigned BOOLEAN default false,
  micro_id VARCHAR (50) UNIQUE,
  micro_server_ip VARCHAR (50),
  micro_password TEXT,
  micro_last_login TIMESTAMP,
  created_on TIMESTAMP default CURRENT_TIMESTAMP,
  start_on TIMESTAMP
)`;

const drop_RequestedAssetTable = 'DROP TABLE IF EXISTS requested_asset_list';
const drop_AssetTable = 'DROP TABLE IF EXISTS asset_list';

 async function initDatabase(action) {

   const pool = new Pool({
     user: config.dbUser,
     host: config.dbHost,
     database: config.dbName,
     password: config.dbPassword,
     port: config.dbPort,
   })

   switch(action) {
     case 'drop_ra':{
       pool.query(drop_RequestedAssetTable, (error, results) => {
         if (error) {
           console.log('----------------------------------------');
           console.log(JSON.stringify(error));
           throw error
         }
         console.log('drop requested asset table');
         console.log(JSON.stringify(results));
       });
     }
       // code block
       break;
     case 'drop_a':{
       pool.query(drop_AssetTable, (error, results) => {
         if (error) {
           console.log('----------------------------------------');
           console.log(JSON.stringify(error));
           throw error
         }
         console.log('drop asset table');
         console.log(JSON.stringify(results));
       });
     }
       // code block
       break;
     case 'create_ra':{
       pool.query(create_RequestedAssetTable, (error, results) => {
         if (error) {
           console.log('----------------------------------------');
           console.log(JSON.stringify(error));
           throw error
         }
         console.log('create requested asset table');
         console.log(JSON.stringify(results));
       });
     }
       // code block
       break;
     case 'create_a':{
       pool.query(create_AssetTable, (error, results) => {
         if (error) {
           console.log('----------------------------------------');
           console.log(JSON.stringify(error));
           throw error ;
         }
         console.log('create asset table');
         console.log(JSON.stringify(results));
       });
     }
       break;
     default:
   }
   await pool.end()
}

start = async (action) => {
  console.log('log is ' + action);
  await initDatabase(action) ;
}


start(process.argv[2],process.argv[3])
