var path = require('path');
var HTMLWebpackPlugin = require('html-webpack-plugin');
var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: __dirname + '/app/index.html',
  filename: 'index.html',
  inject: 'body'
});

module.exports = {
  entry: __dirname + '/app/index.js',
  resolve: {
    alias: {
      'library': path.resolve(__dirname, 'app/library'),
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
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [HTMLWebpackPluginConfig],
  devServer: {
    proxy: {
      '/api': 'http://localhost:8086'
    }
  }
};
