module.exports = {
  plugins: [
    'plugins/markdown'
  ],
  recurseDepth: 100,
  source: {
    include: [
      'app',
      'package.json',
      'README.md'
    ]
  },
  opts: {
    destination: 'docs',
    recurse: true
  }
};
