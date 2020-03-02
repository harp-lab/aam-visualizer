module.exports.engine = function(input, output) {
  return {
    command: 'racket',
    args: ['engine.rkt', '-o', output, input]
  }
}
