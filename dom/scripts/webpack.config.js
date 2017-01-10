const path = require('path');
const webpack = require('webpack');

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: [
    // NOTE: in prod mode, I'll ditch the react-hot-loader, and I can also
    // (maybe) ditch transform-es2015-classes...
    // I want to be able to dev just for latest chrome :P
    'react-hot-loader/patch',
    'webpack-hot-middleware/client',
    path.join(__dirname, '..', 'src'),
  ],
  output: {
    path: path.join(__dirname, '..', 'public'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
  resolve: {
    alias: {
      // treed: path.join(__dirname, '..', '..', 'shared', 'treed'),
    },
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: [
        path.join(__dirname, '..', 'src'),
        path.join(__dirname, '..', '..', 'treed'),
        path.join(__dirname, '..', '..', 'plugins'),
        path.join(__dirname, '..', '..', 'node_modules', 'treed'),
      ],
    }, {
      test: /\.json$/,
      loader: 'json',
      include: [
        path.join(__dirname, '..', 'src'),
        path.join(__dirname, '..', '..', 'server'),
        path.join(__dirname, '..', '..', 'treed'),
        path.join(__dirname, '..', '..', 'plugins'),
        path.join(__dirname, '..', '..', 'node_modules', 'treed'),
      ],
    }, {
      test: /\.less$/,
      loader: 'style-loader!css-loader!less-loader',
      include: [
        path.join(__dirname, '..', 'src'),
        path.join(__dirname, '..', '..', 'treed'),
        path.join(__dirname, '..', '..', 'plugins'),
        path.join(__dirname, '..', '..', 'node_modules', 'treed'),
      ],
    }]
  }
};
