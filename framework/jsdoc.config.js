module.exports = {
  plugins: [
    'plugins/markdown'
  ],
  recurseDepth: 100,
  source: {
    include: [
      'framework',
      'package.json',
      'README.md'
    ]
  },
  opts: {
    destination: 'docs',
    recurse: true
  }
};
