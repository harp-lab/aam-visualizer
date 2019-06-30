const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const Consts = require('./Consts');
const G = require('./Global');

const log = content => G.log(Consts.LOG_TYPE_WATCHER, content);

class Watcher {
  constructor() {
    process.on('message', data => {
      if (!this.state.processing)
        this.processLoop();
    });

    this.state = { processing: false };
    this.processLoop = this.processLoop.bind(this);
    this.processLoop();
  }
  processLoop() {
    const file = this.next();
    if (file) {
      this.state.processing = true;
      this.process(file);
      this.processLoop();
    } else
      this.state.processing = false;
  }
  next() {
    const files = fs.readdirSync(Consts.INPUT_DIR);
    let oldestFile, oldestCtime;
    if (files.length > 0) {
      files.forEach(file => {
        const fileStats = fs.statSync(path.resolve(Consts.INPUT_DIR, file));
        const ctime = fileStats.ctimeMs;
        if (!oldestFile || ctime < oldestCtime) {
          oldestFile = file;
          oldestCtime = ctime;
        }
      });
    }
    return oldestFile;
  }
  process(file) {
    log('calling engine');
    const inputPath = path.resolve(Consts.INPUT_DIR, file)
    const outputPath = path.resolve(Consts.OUTPUT_DIR, file);
    const args = [path.resolve(Consts.ENGINE_DIR, 'engine.rkt'), '-o', outputPath, inputPath];
    const options = {
      cwd: Consts.ENGINE_DIR,
      stdio: 'inherit'
    };
    const output = child_process.spawnSync('racket', args, options);
    this.clean(file, output.status);
    this.notify(file);
  }
  clean(file, code) {
    const inputPath = path.resolve(Consts.INPUT_DIR, file)
    switch (code) {
      case 0:
        log('engine finished');
        break;
      case 2:
        log('parse error');
        this.mark(file, 'parse');
        break;
      default:
        log('error');
        this.mark(file);
        break;
    }
    log('deleting input file')
    fs.unlinkSync(inputPath);
  }
  mark(file, error) {
    const data = fs.readFileSync(path.resolve(Consts.INPUT_DIR, file), { encoding: 'utf-8' });
    const project = JSON.parse(data);
    project.status = 'error';
    project.error = error;
    fs.writeFileSync(path.resolve(Consts.OUTPUT_DIR, file), JSON.stringify(project));
  }
  notify(file) {
    process.send({ id: file });
  }
}

const watcher = new Watcher;