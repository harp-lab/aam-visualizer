const path = require('path');
const nodemon = require('nodemon');

const fconfig = require(path.resolve(process.cwd(), 'framework.config.js'));

const NODEMON_CONSOLE_TAG = '\x1b[90m[nodemon]\x1b[0m';

/**
 * @param {String} content message content
 */
function consoleLog(content) {
  const tag = `\x1b[94mi ${NODEMON_CONSOLE_TAG}`;
  console.log(`${tag} ${content}`);
}

/**
 * @param {String} content message content
 */
function consoleError(content) {
  const tag = `\x1b[91m! ${NODEMON_CONSOLE_TAG}`;
  const error = '\x1b[91m[error]'
  console.error(`${tag} ${content} ${error}`);
}

// create nodemon instance
const devServer = nodemon({
  script: path.resolve(fconfig.FRAMEWORK_DIR, 'server'),
  watch: [
    'framework/server'
  ],
  env: {
    'NODE_ENV': 'development'
  }
});
devServer.on('start', () => consoleLog('server started'));
devServer.on('restart', function(files) {
  let message = 'server restarting...';
  for (const filePath of files) {
    const relPath = `./${path.relative(fconfig.ROOT_DIR, filePath)}`;
    message += `\n  \x1b[1m${relPath}`;
  }
  consoleLog(message);
});
devServer.on('crash', () => consoleError('server crashed'));
