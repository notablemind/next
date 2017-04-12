const path = require('path');
const webpack = require('webpack');

const sourceDirectories = [
  path.join(__dirname, '..', 'src'),
  path.join(__dirname, '..', '..', 'shared'),
  path.join(__dirname, '..', '..', 'treed'),
  path.join(__dirname, '..', '..', 'plugins'),
  path.join(__dirname, '..', '..', 'electron'),
  path.join(__dirname, '..', '..', 'node_modules', 'treed'),
]

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
    new webpack.DefinePlugin({
      DEV: process.env.NODE_ENV !== 'production',
      ELECTRON: !!process.env.ELECTRON,
    }),
  ],
  resolve: {
    alias: {
      // treed: path.join(__dirname, '..', '..', 'shared', 'treed'),
    },
  },

  externals: {
    bindings: true,
  },

  target: process.env.ELECTRON ? 'electron-renderer' : 'web',

  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: sourceDirectories,
    }, {
      test: /\.json$/,
      loader: 'json',
      // include: sourceDirectories.concat([path.join(__dirname, '..', 'public', 'fonts')]),
    }, {
      test: /\.less$/,
      loader: 'style-loader!css-loader!less-loader',
      include: sourceDirectories,
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader',
      // include: sourceDirectories,
    }]
  }
};
