
const path = require('path')
const levi = require('levi')
const filterNode = ({content, type}) => ({content, type})
const fields = {content: true}

module.exports = documentsDir => {
  const db = levi(path.join(documentsDir, '_search_index'))
      .use(levi.tokenizer())
      .use(levi.stemmer())
      .use(levi.stopword())
  return {
    update(id, node) {
      db.put(id, node, {fields})
    },
    search(text) {
      if (text.length < 3) return Promise.resolve([]) // ignore smaller than 3 characters
      return new Promise((res, rej) => db.searchStream(text, {expansions: 10}).toArray(res))
    },
    importDb(docid, nmdb) {

      /*
      return db
        .allDocs({include_docs: true, attachments: true})
        .then(({rows}) => {
          const data = {}
          rows.forEach(({doc}) => (data[doc._id] = doc))
          return data
        })
      */

      return nmdb.allDocs({include_docs: true}).then(({rows}) => {
        console.log('alldocs', rows && rows.length)
        return db.batch(rows.map(({doc}) => ({
          type: 'put',
          key: docid + ':' + doc._id,
          value: filterNode(doc),
          fields,
        })))
      })
    }
  }
}
