const path = require('path');
const chalk = require('chalk');
const nodemon = require('nodemon');

const fconfig = require(path.resolve(process.cwd(), 'framework.config.js'));

const FRAMEWORK_DIR = __dirname;
const SERVER_DIR = path.resolve(FRAMEWORK_DIR, 'server');
const NODEMON_LOG_TAG = chalk.blackBright('[ndm]');

/**
 * @param {String} content message content
 */
function consoleLog(content) {
  const symbol = chalk.blue('i');
  const tag = `${symbol} ${NODEMON_LOG_TAG}`;
  console.log(`${tag} ${content}`);
}

/**
 * @param {String} content message content
 */
function consoleError(content) {
  const symbol = chalk.red('!');
  const tag = `${symbol} ${NODEMON_LOG_TAG}`;
  const error = chalk.redBright('[error]');
  console.error(`${tag} ${content} ${error}`);
}

// create nodemon instance
const devServer = nodemon({
  script: SERVER_DIR,
  delay: '1500',
  watch: [
    SERVER_DIR
  ],
  ignore: [
    path.resolve(SERVER_DIR, 'data')
  ],
  env: {
    'NODE_ENV': 'development'
  }
});
devServer.on('start', () => consoleLog('server started'));
devServer.on('crash', () => consoleError('server crashed'));
devServer.on('restart', function(files) {
  let message = 'server restarting...';
  for (const filePath of files) {
    const relPath = `./${path.relative(fconfig.ROOT_DIR, filePath)}`;
    const coloredPath = chalk.bold(relPath);
    message += `\n  ${coloredPath}`;
  }
  consoleLog(message);
});
devServer.on('quit', function() {
  process.exit();
});

consoleLog('monitor started');
