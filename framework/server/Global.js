const Consts = require('./Consts');

exports.consoleLog = function(type, content) {
  const msgTag = messageTag(type);
  const msgContent = messageContent(type, content);
  console.log(`${msgTag} ${msgContent}`);
}

exports.consoleError = function(type, content) {
  const msgTag = messageTag(type);
  const msgContent = messageContent(type, content);
  console.error(`${msgTag} ERROR: ${msgContent}`);
}

function messageTag(type) {
  switch (type) {
    case Consts.LOG_TYPE_PROJ:
      tag = `[${Consts.LOG_TYPE_SYS}]`;
      break;
    default:
      tag = `[${type}]`;
      break;
  }
  return tag;
}

function messageContent(type, content) {
  switch (type) {
    case Consts.LOG_TYPE_PROJ:
      content = `project ${content}`;
      break;
    default:
      content = `${content}`;
      break;
  }
  return content
}
