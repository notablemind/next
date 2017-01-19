
const express = require('express')
const path = require('path')
const cors = require('cors')
const fs = require('fs')

const jsonBase = path.join(__dirname, 'json')
const publicBase = path.join(__dirname, 'public')
const app = express()

app.use(cors())

const library = require(path.join(jsonBase, 'library.json'))

const itemsById = {}
Object.keys(library).forEach(key => {
  library[key].items.forEach(item => {
    itemsById[item['_id']] = item
  })
})

app.use(express.static(publicBase))

app.get('/api', (req, res) => {
  res.json(library)
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
  const filename = itemsById[id].filename + '-contents'
  fs.readFile(path.join(jsonBase, filename), 'utf8', (err, buffer) => {
    const data = JSON.parse(buffer)
    res.json(data['/' + item])

    // const collections = Object.keys(data.collections).sort()
    // res.header('content-type', 'application/json')
    // res.end(buffer)
  })
})

const port = 6207
app.listen(port, () => {
  console.log(`listening on ${port}`)
})
