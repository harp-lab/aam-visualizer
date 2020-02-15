const merge = require('webpack-merge');

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

module.exports = merge(require('./webpack/config.base.js'), config);
