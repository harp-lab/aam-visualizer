const path = require('path');
const fconfig = require(path.resolve(process.cwd(), 'framework.config.js'));

module.exports = {
  devServer: {
    proxy: {
      '/api': `http://${fconfig.SERVER_HOSTNAME}:${fconfig.SERVER_PORT}`
    }
  }
};
