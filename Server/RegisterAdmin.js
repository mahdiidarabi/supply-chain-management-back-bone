


'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('RegisterAdmin');
var helperCA = require('./fabric/helper-CA.js');
require('./config.js');


async function addAdmin(admin,orgName,accountNumber){

  let response = await helperCA.getRegisteredUser(admin, orgName, accountNumber, true);
  logger.debug('-- returned from registering the admin %s for organization %s',admin,orgName);
  if (response && typeof response !== 'string') {
    logger.debug('Successfully registered the admin %s for organization %s',admin,orgName);
  } else {
    logger.debug('Failed to register the admin %s for organization %s with::%s',admin,orgName,response);
  }

}



addAdmin(process.argv[2] , process.argv[3] , process.argv[4] ) ;
