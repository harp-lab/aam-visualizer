const path = require('path');

const fconfig = require(path.resolve(process.cwd(), 'framework.config.js'));

exports.ENV = process.env.NODE_ENV || 'production';
if (exports.ENV == 'development') {
  exports.INIT_DATA = false;
} else {
  exports.INIT_DAtA = false;
}

exports.ROOT_DIR = fconfig.ROOT_DIR;
exports.SERVER_DIR = __dirname;
exports.DATA_DIR = path.resolve(exports.SERVER_DIR, 'data');
exports.INPUT_DIR = path.resolve(exports.DATA_DIR, 'input');
exports.OUTPUT_DIR = path.resolve(exports.DATA_DIR, 'output');
exports.SAVE_DIR = path.resolve(exports.DATA_DIR, 'save');

exports.ENGINE_DIR = fconfig.ENGINE_DIR;
exports.fext = require(fconfig.FEXT_CONFIG);

exports.BUILD_DIR = fconfig.BUILD_DIR;

exports.HOSTNAME = '127.0.0.1';
exports.PORT = 8086;

exports.LOG_TYPE_INIT = 'init';
exports.LOG_TYPE_HTTP = 'http';
exports.LOG_TYPE_SYS = 'syst';
exports.LOG_TYPE_PROJ = 'proj';
exports.LOG_TYPE_WATCHER = 'wtch';

exports.WATCHER_ACTION_PROCESS = 'process';
exports.WATCHER_ACTION_CANCEL = 'cancel';
