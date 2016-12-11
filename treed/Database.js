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
    const now = Date.now()
    this.data[id] = {
      ...this.data[id],
      [attr]: value,
      modified: now,
    }
    return this.db.upsert(id, doc => ({...doc, [attr]: value, modified: now}))
  }
  update = (id: string, update: any) => {
    const now = Date.now()
    this.data[id] = {
      ...this.data[id],
      ...update,
      modified: now,
    }
    return this.db.upsert(id, doc => ({...doc, ...update, modified: now}))
  }
  save = (doc: any) => {
    doc = {...doc, modified: Date.now()}
    this.data[doc._id] = doc
    this.db.save(doc)
  }
  saveMany = (docs: any) => {
    throw new Error('not implemented right')
    this.db.saveMany(docs)
  }
  delete = (doc: any) => {
    const odoc = this.data[doc._id]
    delete this.data[doc._id]
    this.db.delete(doc)
    .catch(() => ({ok: false}))
    // restore doc if delete didn't actually happen?
    .then(res => {
      console.error('doc delete did not work')
      if (!res.ok) {
        this.data[doc._id] = odoc
      }
    })
  }

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
      if (!this.data[id] || this.data[id].modified !== doc.modified) {
        this.data[id] = doc
        this.onNodeChanged(id)
      }
    }
  }

  _onError = (err: Error) => {
    console.log('sync error')
    console.error(err)
    this._onNotReady(err)
  }
}

