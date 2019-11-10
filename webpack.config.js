const target = process.env.npm_lifecycle_event;
switch (target) {
  case 'dev-client':
    module.exports = require('./webpack.config.dev.js')
    break;
  case 'build':
    module.exports = require('./webpack.config.prod.js')
    break;
}
