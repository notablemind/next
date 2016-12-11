
const pauseMs = 10

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
      this._emitTimeout = setTimeout(this._flush, pauseMs)
    }
  }

  emitMany = (evts) => {
    if (!evts || !evts.length) return
    evts.forEach(evt => this._waitingEvents.add(evt))
    if (!this._emitTimeout) {
      this._emitTimeout = setTimeout(this._flush, pauseMs)
    }
  }

  _flush = () => {
    const called = new Set()
    console.log('flushing', this._waitingEvents)
    for (let evt of this._waitingEvents) {
      if (this.listeners[evt]) {
        this.listeners[evt].forEach(fn => {
          if (!called.has(fn)) {
            called.add(fn)
            fn()
          }
        })
      }
    }
    this._waitingEvents = new Set()
    this._emitTimeout = null
  }
}

