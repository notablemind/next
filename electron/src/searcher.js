
const path = require('path')
const levi = require('levi')
const filterNode = ({content, type, trashed, created, modified, completed}) => ({content, type, trashed, created, modified, completed})
const fields = {content: true}

const key = (docid, nid) => docid + ':' + nid

module.exports = documentsDir => {
  const db = levi(path.join(documentsDir, '_search_index'))
      .use(levi.tokenizer())
      .use(levi.stemmer())
      .use(levi.stopword())
  return {
    update(id, node) {
      return db.put(key(id, node._id), filterNode(node), {fields})
    },
    batch(id, nodes) {
      return db.batch(nodes.map(node => ({type: 'put', key: key(id, node._id), value: filterNode(node), fields})))
    },
    delete(id, nid) {
      return db.del(id + ':' + nid)
    },
    search(text) {
      if (text.length < 3) return Promise.resolve([]) // ignore smaller than 3 characters
      return new Promise((res, rej) => db.searchStream(text, {expansions: 10}).toArray(res))
    },
    importDb(docid, nmdb) {
      return nmdb.allDocs({include_docs: true}).then(({rows}) => {
        console.log('alldocs', rows && rows.length)
        return db.batch(rows.map(({doc}) => ({
          type: 'put',
          key: key(docid, doc._id),
          value: filterNode(doc),
          fields,
        })))
      })
    }
  }
}
