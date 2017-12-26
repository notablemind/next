const path = require('path')

process.env.ELECTRON = true
const config = require('../../../../dom/scripts/webpack.config.js')
config.entry = process.env.NODE_ENV !== 'production' ? [
  'react-hot-loader/patch',
  'webpack-hot-middleware/client',
  path.join(__dirname, 'src', 'run.js'),
] : path.join(__dirname, 'src', 'run.js')

config.output.path = path.join(__dirname, 'public')

module.exports = config
