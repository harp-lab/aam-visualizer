const path = require('path');
const merge = require('webpack-merge');

const rootDir = process.cwd();

const target = process.env.npm_lifecycle_event;
let config;
switch (target) {
  case 'dev-client':
    config = require('./webpack/config.dev.js')
    break;
  case 'build':
    config = require('./webpack/config.prod.js')
    break;
}

const configExtension = path.resolve(rootDir, 'webpack.config.js');

module.exports = merge(require('./webpack/config.base.js'), config, require(configExtension));
