
export default class NotableBase {
  constructor() {
    this.metaById = {}
    this.metaListeners = []
    this.userListeners = []
    this.meta = null
    this.user = null
  }

  init() { throw new Error('not overridden') }
  getFileDb(docid) { throw new Error('not overridden') }
  _updateMeta(id, update) { throw new Error('not implemented') }

  notifyMeta() {
    this.metaListeners.forEach(fn => fn(this.meta))
  }

  notifyMetaById(id: string) {
    if (!this.metaById[id]) return
    this.metaById[id].forEach(fn => fn(this.meta[id]))
  }

  notifyUser() {
    this.userListeners.forEach(fn => fn(this.user))
  }

  onMeta(fn) {
    this.metaListeners.push(fn)
    return () => this.metaListeners.splice(this.metaListeners.indexOf(fn), 1)
  }

  onMetaById(id, fn) {
    if (!this.metaById[id]) this.metaById[id] = []
    this.metaById[id].push(fn)
    return () => this.metaById[id].splice(this.metaById[id].indexOf(fn), 1)
  }

  onUser(fn) {
    this.userListeners.push(fn)
    return () => this.userListeners.splice(this.userListeners.indexOf(fn), 1)
  }

  updateMeta(id, update) {
    this.meta[id] = {
      ...this.meta[id],
      ...update
    }
    this.notifyMeta()
    this.notifyMetaById(id)
    this._updateMeta(id, update)
  }

}
