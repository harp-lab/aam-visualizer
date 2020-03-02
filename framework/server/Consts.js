const path = require('path');

const rootDir = process.cwd();
const package = require(path.resolve(rootDir, 'package.json'));

const fextDir = path.resolve(rootDir, package.config.fextDir);
const serverDir = __dirname;

exports.ENV = process.env.NODE_ENV || 'production';
let INIT_DATA;
if (exports.ENV == 'development')
  INIT_DATA = false;
else
  INIT_DATA = false;
exports.INIT_DATA = INIT_DATA;

exports.HOSTNAME = '127.0.0.1';
exports.PORT = 8086;
exports.DATA_DIR = path.resolve(serverDir, 'data');
exports.INPUT_DIR = path.resolve(exports.DATA_DIR, 'input');
exports.OUTPUT_DIR = path.resolve(exports.DATA_DIR, 'output');
exports.SAVE_DIR = path.resolve(exports.DATA_DIR, 'save');

exports.ENGINE_DIR = path.resolve(fextDir, 'engine');

exports.LOG_TYPE_INIT = 'init';
exports.LOG_TYPE_HTTP = 'http';
exports.LOG_TYPE_SYS = 'syst';
exports.LOG_TYPE_PROJ = 'proj';
exports.LOG_TYPE_WATCHER = 'wtch';

exports.WATCHER_ACTION_PROCESS = 'process';
exports.WATCHER_ACTION_CANCEL = 'cancel';
