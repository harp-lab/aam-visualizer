const path = require('path');

const rootDir = process.cwd();

module.exports = {
  resolve: {
    alias: {
      'drawers': path.resolve(rootDir, 'drawers'),
      'items': path.resolve(rootDir, 'items'),
      'links': path.resolve(rootDir, 'links'),
      'viewers': path.resolve(rootDir, 'viewers')
    }
  }
};
