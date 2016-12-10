
export default class Database {
  constructor(db, settings, emitter, plugins) {
    this.data = {}
    this.emitter = emitter
    this.settings = settings
    this.ready = new Promise((res, rej) => {
      this._onReady = res
      this._onNotReady = rej
    })
    this.db = db
    this.plugins = plugins
    this.db.sync(this._onDump, this._onChange, this._onError)
  }

  set = (id, attr, value) => {
    return this.db.upsert(id, doc => ({...doc, [attr]: value}))
  }
  update = (id, update) => {
    return this.db.upsert(id, doc => ({...doc, ...update}))
  }
  save = doc => this.db.save(doc)
  saveMany = docs => this.db.saveMany(docs)
  delete = doc => this.db.delete(doc)

  _onDump = (data) => {
    this.data = data
    this._onReady()
  }

  _onChange = (id, doc) => {
    if (id === 'settings') {
      if (doc.modified > this.settings.modified) {
        return this.updateSettings(doc)
      }
    }

    if (!doc) {
      delete this.data[id]
    } else {
      // TODO maybe dump this? it risks being out of sync.
      // I'd only want it if speed is an issue
      // if (!this.data[id] || this.data[id].modified < doc.modified) {
      // }
      this.data[id] = doc
      this.emitter.emit('node:' + id)
    }
  }

  _onError = err => {
    console.log('sync error')
    console.error(err)
    this._onNotReady(err)
  }
}

