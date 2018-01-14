const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'engine.js',
    publicPath: '/dist/',
  },
  module: {
    rules: [{
      test: /\.(png|svg|jpg|gif)$/,
      use: ['file-loader'],
    }],
  },
  devtool: 'inline-cheap-source-map',
};
