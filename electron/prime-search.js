#!/usr/bin/env node

const PouchDB = require('pouchdb')
const path = require('path')

const searcher = require('./src/searcher')
const loadMeta = require('./src/loadMeta')

const documentsDir = path.join(__dirname, 'documents')

const s = searcher(documentsDir)
const m = loadMeta(documentsDir)
const ids = Object.keys(m)
let p = Promise.resolve()
ids.forEach(id => {
  console.log('for docid', id)
  const db = new PouchDB(path.join(documentsDir, id))
  p = p.then(() => s.importDb(id, db))
})
p.then(() => console.log('done!'), err => console.log('failed!', err))
