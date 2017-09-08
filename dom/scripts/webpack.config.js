const path = require('path')
const webpack = require('webpack')

const sourceDirectories = [
  path.join(__dirname, '..', 'src'),
  path.join(__dirname, '..', '..', 'shared'),
  path.join(__dirname, '..', '..', 'treed'),
  path.join(__dirname, '..', '..', 'plugins'),
  path.join(__dirname, '..', '..', 'electron'),
  path.join(__dirname, '..', '..', 'node_modules', 'treed'),
]

const PROD = process.env.NODE_ENV === 'production';

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: PROD ? path.join(__dirname, '..', 'src') : [
    // NOTE: in prod mode, I'll ditch the react-hot-loader, and I can also
    // (maybe) ditch transform-es2015-classes...
    // I want to be able to dev just for latest chrome :P
    'react-hot-loader/patch',
    'webpack-hot-middleware/client',
    path.join(__dirname, '..', 'src'),
  ],
  output: {
    path: process.env.ELECTRON
      ? path.join(__dirname, '..', '..', 'electron', 'public')
      : path.join(__dirname, '..', 'public'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      DEV: !PROD,
      ELECTRON: !!process.env.ELECTRON,
    }),
  ],
  resolve: {
    alias: {
      // treed: path.join(__dirname, '..', '..', 'shared', 'treed'),
    },
    // extensions: ['.re', '.js', '.ml', '.json'],
  },

  externals: {
    bindings: true,
  },

  target: process.env.ELECTRON ? 'electron-renderer' : 'web',

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: sourceDirectories,
      },
      {
        test: /\.json$/,
        loader: 'json',
        // include: sourceDirectories.concat([path.join(__dirname, '..', 'public', 'fonts')]),
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader',
        include: sourceDirectories,
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
        // include: sourceDirectories,
      },
      // Not ready yet
      // { test: /\.(re|ml)$/, loader: 'bs-loader' },
    ],
  },
}
