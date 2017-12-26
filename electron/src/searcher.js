
const path = require('path')
const levi = require('levi')
const filterNode = ({content, type, trashed, created, modified, completed}) => ({content, type, trashed, created, modified, completed})
const fields = {content: true}

const key = (docid, nid) => docid + ':' + nid

// the stopwords from levi
const stopWords = [
  'about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 'as', 'at', 'be',
  'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can',
  'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had',
  'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'if', 'in', 'into',
  'is', 'it', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must',
  'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over',
  'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were',
  'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
  'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '$', '1',
  '2', '3', '4', '5', '6', '7', '8', '9', '0', '_'
]

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
    search(text, docid = null) {
      if (!text.length) {
        const opts = {limit: 30}
        if (docid) {
          opts.gt = docid + ':'
          opts.lt = docid + ':~'
        }
        return new Promise((res, rej) => db.readStream(opts).toArray(res))
      }
      // if (text.length < 3) return Promise.resolve([]) // ignore smaller than 3 characters
      const opts = {}
      if (docid) {
        opts.gt = docid + ':'
        opts.lt = docid + ':~'
      }
      if (text.match(/^"[^"]+"$/)) {
        const quote = text.slice(1, -1).toLowerCase()
        const firstWord = quote.split(/\s+/).filter(w => !stopWords.includes(w))[0]
        return new Promise((res, rej) => db.searchStream(firstWord, opts).toArray(res))
          .then(items => items.filter(node => !node.value.trashed))
          .then(items => items.filter(node => node.value.content.toLowerCase().includes(quote)))
      }
      opts.expansions = 10
      opts.limit = 30
      return new Promise((res, rej) => db.searchStream(text, opts).toArray(res))
          .then(items => items.filter(node => !node.value.trashed))
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
