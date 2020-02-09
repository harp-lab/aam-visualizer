const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { EnvironmentPlugin } = require('webpack');

const CleanWebpackPluginConfig = new CleanWebpackPlugin();
const HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: __dirname + '/app/index.html',
  filename: 'index.html',
  inject: 'body'
});
const EnvironmentPluginConfig = new EnvironmentPlugin({
  VERSION: require('./package.json').version
});

module.exports = {
  entry: __dirname + '/app/index.js',
  resolve: {
    alias: {
      'component-data': path.resolve(__dirname, 'app/components/data'),
      'component-dialogs': path.resolve(__dirname, 'app/components/dialogs'),
      'component-items': path.resolve(__dirname, 'app/components/items'),
      'component-links': path.resolve(__dirname, 'app/components/links'),
      'component-viewers': path.resolve(__dirname, 'app/components/viewers'),
      'library': path.resolve(__dirname, 'app/library'),
      'store': path.resolve(__dirname, 'app/redux/store.js'),
      'store-action-types': path.resolve(__dirname, 'app/redux/actionTypes.js'),
      'store-actions': path.resolve(__dirname, 'app/redux/actions'),
      'store-apis': path.resolve(__dirname, 'app/redux/apis'),
      'store-consts': path.resolve(__dirname, 'app/redux/consts.js'),
      'store-selectors': path.resolve(__dirname, 'app/redux/selectors')
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
    path: path.resolve(__dirname, 'build')
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
    CleanWebpackPluginConfig,
    HTMLWebpackPluginConfig,
    EnvironmentPluginConfig
  ]
};
