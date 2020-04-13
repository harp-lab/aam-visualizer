const path = require('path');
const package = require(path.resolve(__dirname, 'package.json'));

exports.ROOT_DIR = __dirname;

exports.FEXT_DIR = path.resolve(exports.ROOT_DIR, package.config.fextDir);
exports.FEXT_CONFIG = path.resolve(exports.FEXT_DIR, package.config.fextConfig);
exports.ENGINE_DIR = path.resolve(exports.FEXT_DIR, 'engine');
exports.WEBPACK_CONFIG = path.resolve(exports.FEXT_DIR, 'webpack.config.js');

exports.BUILD_DIR = path.resolve(exports.ROOT_DIR, 'build');

exports.SERVER_HOSTNAME = '127.0.0.1';
exports.SERVER_PORT = 8086;
