const path = require('path');
const merge = require('webpack-merge');

const fconfig = require(path.resolve(process.cwd(), 'framework.config.js'));

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

const configExtension = path.resolve(fconfig.FEXT_DIR, 'webpack.config.js');

module.exports = merge(require('./webpack/config.base.js'), config, require(configExtension));
