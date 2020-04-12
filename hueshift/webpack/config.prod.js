const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const CleanWebpackPluginConfig = new CleanWebpackPlugin();

module.exports = {
  mode: 'production',
  plugins: [
    CleanWebpackPluginConfig
  ]
};
