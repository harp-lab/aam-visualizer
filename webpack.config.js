const path = require('path');

const rootDir = process.cwd();

module.exports = {
  resolve: {
    alias: {
      'items': path.resolve(rootDir, 'items'),
      'links': path.resolve(rootDir, 'links'),
    }
  }
};
