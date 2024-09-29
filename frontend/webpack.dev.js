const { merge } = require('webpack-merge');
const Dotenv = require('dotenv-webpack');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  plugins: [
    new Dotenv({
      path: '.env.dev',
    }),
  ],
  devtool: 'inline-source-map',
  devServer: {
    static: {
        directory: path.join(__dirname, '.'),
      },
    compress: true,
    host: 'localhost',
    port: 8080,
    hot: true,
    open: false,
  },
});
