const HTMLWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { EnvironmentPlugin } = require('webpack');

const rootDir = process.cwd();
const package = require(path.resolve(rootDir, 'package.json'));

const frameworkDir = path.resolve(rootDir, package.config.frameworkDir);
const appDir = path.resolve(frameworkDir, 'app');

const HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: path.resolve(appDir, 'index.html'),
  filename: 'index.html',
  inject: 'body'
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

      'fext': path.resolve(rootDir, package.config.fextDir)
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
    path: path.resolve(rootDir, 'build')
  },
  optimization: {
    moduleIds: 'hashed',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    },
  },
  plugins: [
    HTMLWebpackPluginConfig,
    EnvironmentPluginConfig
  ]
};
