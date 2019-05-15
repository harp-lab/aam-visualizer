const path = require('path');

exports.ENV = process.env.NODE_ENV || 'production';
let HEADERS, INIT_DATA;
if (exports.ENV == 'development')
{
  HEADERS =
  {
    'Access-Control-Allow-Origin': '*'
  };
  INIT_DATA = false;
}
else
{
  HEADERS = {};
  INIT_DATA = false;
}
exports.HEADERS = HEADERS;
exports.INIT_DATA = INIT_DATA;

exports.HOSTNAME = '127.0.0.1';
exports.PORT = 8086;
exports.DATA_DIR = `${__dirname}/data`;
exports.INPUT_DIR = `${exports.DATA_DIR}/input`;
exports.OUTPUT_DIR = `${exports.DATA_DIR}/output`;
exports.SAVE_DIR = `${exports.DATA_DIR}/save`;

exports.ENGINE_DIR = `${__dirname}/engine`;

exports.LOG_TYPE_INIT = 'init';
exports.LOG_TYPE_HTTP = 'http';
exports.LOG_TYPE_SYS = 'syst';
exports.LOG_TYPE_PROJ = 'proj';
exports.LOG_TYPE_WATCHER = 'wtch';
