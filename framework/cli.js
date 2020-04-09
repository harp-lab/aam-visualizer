#!/usr/bin/env node
const child_process = require('child_process');
const path = require('path');
const yargs = require('yargs');
const { FRAMEWORK_DIR } = require(path.resolve(process.cwd(), 'framework.config.js'));

yargs
  .command('start', 'start application', () => {}, function(argv) {
    const serverPath = path.resolve(FRAMEWORK_DIR, 'server');
    child_process.spawn('node', [serverPath], { stdio: 'inherit' });
  })
  .command('build', 'build application', () => {}, function(argv) {
    const webpackConfigPath = path.resolve(FRAMEWORK_DIR, 'webpack.config.js');
    child_process.spawn(
      'npx', ['webpack', '--config', webpackConfigPath],
      {
        env: {...process.env, fenv: 'production' },
        stdio: 'inherit'
      }
    );
  })
  .command('dev', 'start development environment', () => {}, function(argv) {
    // start dev server
    const nodemonPath = path.resolve(FRAMEWORK_DIR, 'nodemon.js');
    child_process.spawn('node', [nodemonPath], { stdio: 'inherit' });

    // start dev client
    const webpackConfigPath = path.resolve(FRAMEWORK_DIR, 'webpack.config.js');
    child_process.spawn(
      'npx', ['webpack-dev-server', '--config', webpackConfigPath],
      {
        env: { ...process.env, fenv: 'development' },
        stdio: 'inherit'
      }
    );
  })
  .command('docs', 'generate documentation', () => {}, function(argv) {
    const jsdocConfigPath = path.resolve(FRAMEWORK_DIR, 'jsdoc.config.js');
    child_process.spawn('npx', ['jsdoc', '-c', jsdocConfigPath], { stdio: 'inherit' });
  })
  .argv;
