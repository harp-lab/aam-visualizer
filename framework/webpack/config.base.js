const HTMLWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { EnvironmentPlugin } = require('webpack');

const rootDir = process.cwd();
const frameworkDir = path.resolve(rootDir, 'framework');
const appDir = path.resolve(frameworkDir, 'app');
const componentsDir = path.resolve(appDir, 'components');
const storeDir = path.resolve(appDir, 'store');

const HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: path.resolve(appDir, 'index.html'),
  filename: 'index.html',
  inject: 'body'
});
const EnvironmentPluginConfig = new EnvironmentPlugin({
  VERSION: require(path.resolve(rootDir, 'package.json')).version
});

module.exports = {
  entry: path.resolve(appDir, 'index.js'),
  resolve: {
    alias: {
      'component-data': path.resolve(componentsDir, 'data'),
      'component-dialogs': path.resolve(componentsDir, 'dialogs'),
      'component-items': path.resolve(rootDir, 'items'),
      'component-links': path.resolve(rootDir, 'links'),
      'component-viewers': path.resolve(rootDir, 'viewers'),
      'layouts': path.resolve(rootDir, 'layouts'),
      'library': path.resolve(appDir, 'library'),
      'store': storeDir,
      'store-action-types': path.resolve(storeDir, 'actionTypes.js'),
      'store-actions': path.resolve(storeDir, 'actions'),
      'store-apis': path.resolve(storeDir, 'apis'),
      'store-consts': path.resolve(storeDir, 'consts.js'),
      'store-selectors': path.resolve(storeDir, 'selectors')
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
