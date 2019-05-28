const Consts = require('./Consts');

class Global {
  static log(type, content) {
    switch (type) {
      case Consts.LOG_TYPE_PROJ:
        content = `[${Consts.LOG_TYPE_SYS}] project ${content}`;
        break;
      default:
        content = `[${type}] ${content}`;
        break;
    }
    console.log(content);
  }
}

module.exports = Global;
