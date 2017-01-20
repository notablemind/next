
const express = require('express')
const path = require('path')
const cors = require('cors')
const fs = require('fs')

const jsonBase = path.join(__dirname, 'json')
const publicBase = path.join(__dirname, 'public')
const app = express()

app.use(cors())

const library = require(path.join(jsonBase, 'library.json'))
const uriIndex = require(path.join(__dirname, 'uri-index.json'))

const itemsById = {}
Object.keys(library).forEach(key => {
  library[key].items = library[key].items.map(item => {
    itemsById[item['_id']] = item
    return item['_id']
  })
})

const makeCanonical = text => text.toLowerCase().replace(/[^a-z\s]/g, '')

const titles = require(path.join(__dirname, 'titles.json'))
titles.forEach(item => (
  item.canon = makeCanonical(item.title),
  item.subcanon = makeCanonical(item.subtitle || '')
))

app.use(express.static(publicBase))

app.get('/api', (req, res) => {
  res.json({library, uriIndex, itemsById})
})

app.get('/api/search/by-title', (req, res) => {
  // console.log(req.query.title)
  const canon = makeCanonical(req.query.title)
  res.json(titles.filter(
    item => item.canon.indexOf(canon) !== -1 ||
            item.subcanon.indexOf(canon) !== -1
  ))
})

app.get('/api/:id', (req, res) => {
  const {id} = req.params
  const filename = itemsById[id].filename
  fs.readFile(path.join(jsonBase, filename), 'utf8', (err, buffer) => {
    const data = JSON.parse(buffer)
    const collections = Object.keys(data.collections).sort()
    const items = data.collections[collections[0]].children
    res.json(data)
    // res.json(items.map(uri => data.items[uri]))
    // res.header('content-type', 'application/json')
    // res.end(buffer)
  })
})

app.get('/api/:id/*', (req, res) => {
  const {id} = req.params
  const item = req.params[0]
  const filename =
  fs.readFile(path.join(jsonBase, itemsById[id].filename + '-contents'), 'utf8', (err, buffer) => {
    fs.readFile(path.join(jsonBase, itemsById[id].filename), 'utf8', (err, metabuffer) => {
      const data = JSON.parse(buffer)
      const meta = JSON.parse(metabuffer).items['/' + item]
      meta.content = data['/' + item]
      res.json(meta) // data['/' + item])

      // const collections = Object.keys(data.collections).sort()
      // res.header('content-type', 'application/json')
      // res.end(buffer)
    })
  })
})

const port = 6207
app.listen(port, () => {
  console.log(`listening on ${port}`)
})
