const path = require('path')
const webpack = require('webpack')
const express = require('express')
const devMiddleware = require('webpack-dev-middleware')
const hotMiddleware = require('webpack-hot-middleware')
const config = require('./webpack.config')

const app = express()
const compiler = webpack(config)

const port = process.env.PORT || 4150

app.use(
  devMiddleware(compiler, {
    publicPath: config.output.publicPath,
    historyApiFallback: true
  })
)

app.use(hotMiddleware(compiler))
app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

app.listen(port, err => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening at http://localhost:${port}/`)
})
