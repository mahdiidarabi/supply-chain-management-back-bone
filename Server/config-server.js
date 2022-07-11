// Server CONFIG
// var fs = require('fs');
// var privateKey  = fs.readFileSync('key/SCM_Server_rsa', 'utf8');
// var certificate = fs.readFileSync('key/SCM_Server_rsa.crt', 'utf8');
//
// var credentials = {key: privateKey, cert: certificate};

var host = '81.31.168.185' ;
var httpPort = 4000 ;
var httpsPort = 9443 ;

var h = 3600 ; var m = 60 ;
var jwtExpireTime =  1 * 5 * 24 * h + 0 * m ;
var jwtExpireTimeForMicro =  10 * 30 * 24 * h + 0 * m ;
var jwtSecret =  'RoLaKo4_kNl10LW6nHG2_Gbr5POAuqd9mMVAcbAgbLYvIJTNG2A6nm15ZxrYfEt3bK_fZhsxhZ5mXX9Q-ZsXSQ'

// module.exports.credentials = credentials ;
module.exports.host = host ;
module.exports.httpPort = httpPort ;
module.exports.httpsPort = httpsPort ;
module.exports.jwtExpireTime = jwtExpireTime ;
module.exports.jwtExpireTimeForMicro = jwtExpireTimeForMicro ;
module.exports.jwtSecret = jwtSecret ;
