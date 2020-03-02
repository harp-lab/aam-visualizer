const path = require('path');

exports.ROOT_DIR = process.cwd();
exports.FRAMEWORK_DIR = path.resolve(exports.ROOT_DIR, 'framework');

exports.FEXT_DIR = path.resolve(exports.ROOT_DIR, 'fext');
exports.FEXT_CONFIG = path.resolve(exports.FEXT_DIR, 'fext.config.js');
exports.ENGINE_DIR = path.resolve(exports.FEXT_DIR, 'engine');

exports.BUILD_DIR = path.resolve(exports.ROOT_DIR, 'build');
