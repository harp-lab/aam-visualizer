const chalk = require('chalk');

const { SERVER_LOG_TAG, LOG_TYPE_PROJ, LOG_TYPE_SYS } = require('./Consts');

exports.consoleLog = function(type, content) {
  const symbol = chalk.blue('i');
  const tag = `${symbol} ${SERVER_LOG_TAG}`;
  const msgTag = messageTag(type);
  const msgContent = messageContent(type, content);
  console.log(`${tag} ${msgContent} ${msgTag}`);
}

exports.consoleError = function(type, content) {
  const symbol = chalk.red('!');
  const tag = `${symbol} ${SERVER_LOG_TAG}`;
  const msgTag = messageTag(type);
  const msgContent = messageContent(type, content);
  const error = chalk.redBright('[error]');
  console.error(`${tag} ${msgContent} ${msgTag} ${error}`);
}

function messageTag(type) {
  switch (type) {
    case LOG_TYPE_PROJ:
      tag = chalk.greenBright(`[${LOG_TYPE_SYS}]`);
      break;
    default:
      tag = chalk.greenBright(`[${type}]`);
      break;
  }
  return tag;
}

function messageContent(type, content) {
  switch (type) {
    case LOG_TYPE_PROJ:
      content = `project ${content}`;
      break;
    default:
      content = `${content}`;
      break;
  }
  return content
}
