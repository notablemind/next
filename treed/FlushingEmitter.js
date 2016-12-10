
export default class FlushingEmitter {
  constructor() {
    this.listeners = {}
    this._waitingEvents = new Set()
    this._emitTimeout = null
  }

  on = (evt, fn) => {
    if (!this.listeners[evt]) this.listeners[evt] = new Set()
    this.listeners[evt].add(fn)
  }

  off = (evt, fn) => {
    if (!this.listeners[evt]) return
    this.listeners[evt].delete(fn)
  }

  emit = (evt) => {
    if (!evt) return
    this._waitingEvents.add(evt)
    if (!this._emitTimeout) {
      this._emitTimeout = setImmediate(this._flush)
    }
  }

  emitMany = (evts) => {
    if (!evts || !evts.length) return
    evts.forEach(evt => this._waitingEvents.add(evt))
    if (!this._emitTimeout) {
      this._emitTimeout = setImmediate(this._flush)
    }
  }

  _flush = () => {
    for (let evt of this._waitingEvents) {
      if (this.listeners[evt]) {
        this.listeners[evt].forEach(fn => fn())
      }
    }
    this._waitingEvents = new Set()
    this._emitTimeout = null
  }
}

