/**
 * provide command and arguments to be spawned as a child process by server watcher
 * @param {String} input input file path
 * @param {String} output output file path
 */
exports.engine = function(input, output) {
  return {
    command: 'racket',
    args: ['engine.rkt', '-o', output, input]
  };
}
