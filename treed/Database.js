// @flow
import type {Db} from './types'

type Action = {
  type: 'set',
  now: number,
  id: string,
  attr: string,
  value: any,
} | {
  type: 'setNested',
  now: number,
  id: string,
  attrs: Array<string>,
  last: string,
  value: any
} | {
  type: 'update',
  now: number,
  id: string,
  update: any,
} | {
  type: 'save',
  doc: any,
} | {
  type: 'saveMany',
  docs: any,
} | {
  type: 'delete',
  doc: any,
}

window.DEBUG_CHANGES = false

export default class Database<D> {
  db: Db<D>
  plugins: any
  settings: any
  data: any
  _onReady: () => void
  _onNotReady: () => void
  ready: Promise<void>
  onNodeChanged: (id: string) => void
  onSettingsChanged: () => void
  queue: Promise<void>
  myrevs: Set<string>

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

    this.queue = Promise.resolve()
    this.myrevs = new Set()
  }

  _add(action: Action): Promise<void> {
    const prom = this.queue = this.queue.then(() => {
      switch (action.type) {
        case 'set':
          const a = action // flow :(
          return this.db.upsert(a.id, doc => ({...doc, [a.attr]: a.value, modified: a.now}))
        case 'setNested':
          const b = action // flow :(
          return this.db.upsert(b.id, doc => {
            doc = {...doc, modified: b.now}
            const lparent = b.attrs.reduce((o, a) => o[a] = {...o[a]}, doc)
            lparent[b.last] = b.value
            return doc
          })
        case 'update':
          const c = action // flow :(
          return this.db.upsert(c.id, doc => ({...doc, ...c.update, modified: c.now}))
          //return this.db.save({
            //...this.db.data[action.id],
        case 'save':
          return this.db.save({
            ...action.doc,
            _rev: this.data[action.doc._id]._rev,
          })
        case 'saveMany':
          const reved = action.docs.map(doc => ({
            ...doc,
            _rev: this.data[doc._id]._rev,
          }))
          // console.log('saving many', action.docs, reved)
          return this.db.saveMany(reved)
        case 'delete':
          return this.db.delete({
            ...action.doc,
            _rev: this.data[action.doc._id]._rev
          })
      }
    })
    // .then(() => new Promise(r => setTimeout(r, 1000)))
    .then((r: any) => {
      if (window.DEBUG_CHANGES) {
        console.log('done', r, action)
      }
      if (Array.isArray(r)) {
        // TODO potentially bad things will happen if there's conflict
        // w/ two people editing the same children at the same time n stuff.
        // so I need to have login in here to handle conflicts.
        // and like, what do I do?
        // mostly the big problem is that people can get into a broken state
        // where there has been a doc deleted from the DB but its ID is still
        // hanging around in a parent.
        // So maybe the best choice is to check incoming nodes & make sure
        // their children exist? probably after a timeout though.
        // hmmm yeah?
        // Also retry behavior here.
        r.forEach((rr, i) => {
          this.myrevs.add(rr.rev)
          if (action.type === 'saveMany') {
            const docs: any = action.docs
            this.data[docs[i]._id]._rev = rr.rev
          }
        })
        // Aaaaand this is maybe the point where I wonder if implementing an
        // event sourcing solution wouldn't make more sense? So I could get
        // atomic actions & resolve them. I'm already streaming changes, and I
        // think pouch hangs on to everything, so it's not like I'd be using
        // more memory, right?
        //
        // Something to think about.
      } else {
        this.myrevs.add(r.rev)
        if (action.id) {
          if (this.data[action.id]) {
            this.data[action.id]._rev = r.rev
          }
        } else if (action.doc) {
          const doc: any = action.doc // grr flow
          if (this.data[doc._id]) {
            this.data[doc._id]._rev = r.rev
          }
        }
      }
    })
    return prom
  }

  set = (id: string, attr: string, value: any) => {
    const now = Date.now()
    this.data[id] = {
      ...this.data[id],
      [attr]: value,
      modified: now,
    }
    this.onNodeChanged(id)
    return this._add({type: 'set', id, attr, value, now})
  }

  setNested = (id: string, attrs: Array<string>, value: any) => {
    const now = Date.now()
    const node = {...this.data[id], modified: now}
    attrs = attrs.slice()
    const last = attrs.pop()
    const lparent = attrs.reduce((o, a) => o[a] = {...o[a]}, node)
    lparent[last] = value
    this.data[id] = node
    this.onNodeChanged(id)
    return this._add({type: 'setNested', id, attrs, value, now, last})
  }

  update = (id: string, update: any) => {
    const now = Date.now()
    this.data[id] = {
      ...this.data[id],
      ...update,
      modified: now,
    }
    this.onNodeChanged(id)
   return this._add({type: 'update', id, update, now})
  }

  save = (doc: any) => {
    doc = {...doc, modified: Date.now()}
    // mostly, never overwrite revs.
    if (this.data[doc._id]) doc._rev = this.data[doc._id]._rev
    this.data[doc._id] = doc
    this.onNodeChanged(doc._id)
    return this._add({type: 'save', doc})
  }

  saveMany = (docs: any) => {
    const now = Date.now()
    docs = docs.map(doc => ({...doc, modified: now}))
    // mostly, never overwrite revs.
    docs.forEach(doc => this.data[doc._id] = {...doc, _rev: (this.data[doc._id] || {})._rev})
    docs.forEach(doc => this.onNodeChanged(doc._id))
    return this._add({type: 'saveMany', docs})
  }

  delete = (doc: any) => {
    delete this.data[doc._id]
    return this._add({type: 'delete', doc})
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
      /*
      if (this.data[id]._rev && +doc._rev.split('-')[0] < +this.data[id]._rev.split('-')[0]) {
        // discard, it's old
      }
      */
      setTimeout(() => {
        if (this.myrevs.has(doc._rev)) {
          // console.log('skipping my', doc._rev)
          this.myrevs.delete(doc._rev)
          return
          // this was my change, plz ignore
        }
        // console.log('onchange', id, doc && doc._rev)
      if (!this.data[id] || this.data[id].modified !== doc.modified) {
        this.data[id] = doc
        this.onNodeChanged(id)
      } else {
        this.data[id]._rev = doc._rev
      }

      }, 10)
    }
  }

  _onError = (err: Error) => {
    console.log('sync error')
    console.error(err)
    this._onNotReady(err)
  }
}

