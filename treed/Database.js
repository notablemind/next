// @flow

export default class Database {
  db: any
  plugins: any
  settings: any
  data: any
  _onReady: () => void
  _onNotReady: () => void
  ready: Promise<void>
  onNodeChanged: (id: string) => void
  onSettingsChanged: () => void

  constructor(db: any, plugins: any, onNodeChanged: any, onSettingsChanged: any) {
    this.data = {}
    this.ready = new Promise((res, rej) => {
      this._onReady = res
      this._onNotReady = rej
    })
    this.db = db
    this.plugins = plugins
    this.onNodeChanged = onNodeChanged
    this.onSettingsChanged = onSettingsChanged
    this.db.sync(this._onDump, this._onChange, this._onError)
  }

  set = (id: string, attr: string, value: any) => {
    return this.db.upsert(id, doc => ({...doc, [attr]: value}))
  }
  update = (id: string, update: any) => {
    return this.db.upsert(id, doc => ({...doc, ...update}))
  }
  save = (doc: any) => this.db.save(doc)
  saveMany = (docs: any) => this.db.saveMany(docs)
  delete = (doc: any) => this.db.delete(doc)

  _onDump = (data: any, settings: any) => {
    this.settings = settings
    this.data = data
    this._onReady()
  }

  _onChange = (id: string, doc: any) => {
    if (id === 'settings') {
      this.settings = doc
      this.onSettingsChanged()
      return
    }

    if (!doc) {
      delete this.data[id]
    } else {
      // TODO maybe dump this? it risks being out of sync.
      // I'd only want it if speed is an issue
      // if (!this.data[id] || this.data[id].modified < doc.modified) {
      // }
      this.data[id] = doc
      this.onNodeChanged(id)
    }
  }

  _onError = (err: Error) => {
    console.log('sync error')
    console.error(err)
    this._onNotReady(err)
  }
}

