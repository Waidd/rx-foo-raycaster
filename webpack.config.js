const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'engine.js',
  },
  devtool: 'inline-cheap-source-map',
};
