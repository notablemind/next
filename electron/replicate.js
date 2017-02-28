
const PouchDB = require('pouchdb')
const id = '15f9999b9d9b746b38c4d86158' // '198f9fe92ee12e4def22210fca'
let db1 = new PouchDB('./saved_documents/' + id)
let db2 = new PouchDB('./documents/' + id)
PouchDB.replicate(db1, db2).on('complete', () => {
  console.log('done!')
  db1.close()
  db2.close()
})

