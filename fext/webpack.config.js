const path = require('path');

const rootDir = process.cwd();

/** webpack config extension */
exports.config = {
  resolve: {
    alias: {
      'drawers': path.resolve(rootDir, 'drawers'),
      'items': path.resolve(rootDir, 'items'),
      'links': path.resolve(rootDir, 'links'),
      'viewers': path.resolve(rootDir, 'viewers')
    }
  }
};

/**
 * inject html into head
 * @returns {String} html output
 */
exports.headTemplate = function() {
  return `<title>AAM Visualizer</title>`;
}

/**
 * inject html into body
 * @returns {String} html output
 */
exports.bodyTemplate = function() {
  return ``;
}
