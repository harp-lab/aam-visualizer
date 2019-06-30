const child_process = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const Consts = require('./Consts');
const G = require('./Global');

const log = content => G.log(Consts.LOG_TYPE_WATCHER, content);

class Watcher {
  constructor() {
    process.on('message', data => {
      const action = data.action;
      switch (action) {
        case Consts.WATCHER_ACTION_PROCESS:
          if (!this.state.processing)
            this.processLoop();
          break;
        case Consts.WATCHER_ACTION_CANCEL:
          this.revert(data.id);
          break;
        default:
          log(`invalid watcher action (${action})`);
          break;
      }
    });

    this.state = { processing: false, interrupt: false };
    this.processLoop = this.processLoop.bind(this);
    this.processLoop();
  }
  async processLoop() {
    const file = await this.next();
    if (file) {
      if (!this.state.interrupt) {
        this.state.processing = true;
        await this.process(file);
        await this.processLoop();
      }
    } else
      this.state.processing = false;
  }
  interrupt() {
    this.state.interrupt = true;
  }
  resume() {
    this.state.interrupt = false;
    if (this.state.processing)
      this.processLoop();
  }
  async next() {
    const files = await fsp.readdir(Consts.INPUT_DIR);
    let oldestFile, oldestCtime;
    if (files.length > 0) {
      for await (const file of files) {
        const fileStats = await fsp.stat(path.resolve(Consts.INPUT_DIR, file));
        const ctime = fileStats.ctimeMs;
        if (!oldestFile || ctime < oldestCtime) {
          oldestFile = file;
          oldestCtime = ctime;
        }
      };
    }
    return oldestFile;
  }
  async process(file) {
    log('calling engine');
    const inputPath = path.resolve(Consts.INPUT_DIR, file)
    const outputPath = path.resolve(Consts.OUTPUT_DIR, file);
    const args = [path.resolve(Consts.ENGINE_DIR, 'engine.rkt'), '-o', outputPath, inputPath];
    const options = {
      cwd: Consts.ENGINE_DIR,
      stdio: 'inherit'
    };

    const code = await new Promise((resolve, reject) => {
      this.engineProcess = child_process.spawn('racket', args, options);
      this.engineProcess.on('exit', code => resolve(code));
      this.fileProcess = file;
    });
    if (!this.engineProcess.killed) {
      await this.clean(file, code);
      this.notify(file, Consts.WATCHER_ACTION_PROCESS);
    }
  }
  async clean(file, code) {
    const inputPath = path.resolve(Consts.INPUT_DIR, file)
    switch (code) {
      case 0:
        log('engine finished');
        break;
      case 2:
        log('parse error');
        await this.mark(file, 'parse');
        break;
      default:
        log('error');
        await this.mark(file);
        break;
    }
    log('deleting input file')
    await fsp.unlink(inputPath);
  }
  async mark(file, error) {
    const srcPath = path.resolve(Consts.INPUT_DIR, file);
    const destPath = path.resolve(Consts.OUTPUT_DIR, file);
    const project = await this.read(srcPath);
    project.status = 'error';
    project.error = error;
    await this.write(destPath, project);
  }
  async revert(file) {
    if (this.fileProcess == file) {
      this.interrupt();
      this.engineProcess.kill();
    }

    const srcPath = path.resolve(Consts.INPUT_DIR, file);
    const destPath = path.resolve(Consts.SAVE_DIR, file);
    const project = await this.read(srcPath);
    await fsp.unlink(srcPath);

    project.status = 'edit';

    await this.write(destPath, project);

    this.resume();
    this.notify(file, Consts.WATCHER_ACTION_CANCEL);
  }
  notify(file, action) {
    process.send({
      id: file,
      action
    });
  }
  async read(path) {
    const file = await fsp.open(path)
    const data = await file.readFile({encoding: 'utf-8'});
    await file.close();

    return JSON.parse(data);
  }
  async write(path, data) {
    const file = await fsp.open(path, 'w');
    await file.writeFile(JSON.stringify(data));
    await file.close();
  }
}

const watcher = new Watcher;