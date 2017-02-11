const PouchDB = require('pouchdb');
const replicationStream = require('pouchdb-replication-stream');
const MemoryStream = require('memorystream');

PouchDB.plugin(replicationStream.plugin);
PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

export const toString = db => {
  let dumpedString = '';
  const stream = new MemoryStream();
  stream.on('data', chunk => {
    dumpedString += chunk.toString();
  });

  return db.dump(stream).then(function () {
    return dumpedString
  })
}

export const fromString = (string, db) => {
  const stream = new MemoryStream(string);
  return db.load(stream)
}
