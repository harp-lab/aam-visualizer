const HTMLWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { EnvironmentPlugin } = require('webpack');
const fconfig = require(path.resolve(process.cwd(), 'framework.config.js'));
const package = require(path.resolve(process.cwd(), 'package.json'));

const frameworkDir = path.resolve(__dirname, '..');
const appDir = path.resolve(frameworkDir, 'app');

const HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: path.resolve(appDir, 'template.js')
});
const EnvironmentPluginConfig = new EnvironmentPlugin({
  VERSION: package.version
});

module.exports = {
  entry: path.resolve(appDir, 'index.js'),
  resolve: {
    alias: {
      'extensions': path.resolve(frameworkDir, 'extensions'),
      'components': path.resolve(appDir, 'components'),
      'library': path.resolve(appDir, 'library'),
      'store': path.resolve(appDir, 'store'),
      'fext': fconfig.FEXT_DIR
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        },
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: 'css-loader'
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: 'file-loader'
      }
    ]
  },
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    path: fconfig.BUILD_DIR
  },
  optimization: {
    moduleIds: 'hashed',
    runtimeChunk: 'multiple',
    splitChunks: {
      chunks: 'all',
      maxSize: 244000
    },
  },
  plugins: [
    HTMLWebpackPluginConfig,
    EnvironmentPluginConfig
  ],
  stats: 'minimal'
};
