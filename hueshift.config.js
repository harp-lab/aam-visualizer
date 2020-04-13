const path = require('path');
const package = require(path.resolve(__dirname, 'package.json'));

module.exports = {
  fext: {
    path: 'fext',
    config: 'fext/fext.config.js'
  },
  engine: {
    path: 'fext/engine'
  },
  webpack: {
    config: 'fext/webpack.config.js',
    build: 'build'
  },
  server: {
    hostname: 'localhost',
    port: 8086
  }
};
