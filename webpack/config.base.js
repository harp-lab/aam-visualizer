const HTMLWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { EnvironmentPlugin } = require('webpack');

const rootDir = process.cwd();

const HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: path.resolve(rootDir, 'app/index.html'),
  filename: 'index.html',
  inject: 'body'
});
const EnvironmentPluginConfig = new EnvironmentPlugin({
  VERSION: require(path.resolve(rootDir, 'package.json')).version
});

module.exports = {
  entry: path.resolve(rootDir, 'app/index.js'),
  resolve: {
    alias: {
      'component-data': path.resolve(rootDir, 'app/components/data'),
      'component-dialogs': path.resolve(rootDir, 'app/components/dialogs'),
      'component-items': path.resolve(rootDir, 'app/components/items'),
      'component-links': path.resolve(rootDir, 'app/components/links'),
      'component-viewers': path.resolve(rootDir, 'app/components/viewers'),
      'library': path.resolve(rootDir, 'app/library'),
      'store': path.resolve(rootDir, 'app/store'),
      'store-action-types': path.resolve(rootDir, 'app/store/actionTypes.js'),
      'store-actions': path.resolve(rootDir, 'app/store/actions'),
      'store-apis': path.resolve(rootDir, 'app/store/apis'),
      'store-consts': path.resolve(rootDir, 'app/store/consts.js'),
      'store-selectors': path.resolve(rootDir, 'app/store/selectors')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
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
