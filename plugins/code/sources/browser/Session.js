
const consoleFn = (level, onIo) => (...args) => onIo({
  type: 'console', level, args,
})

const makeConsole = onIo => {
  return {
    log: consoleFn('log', onIo),
    warn: consoleFn('warn', onIo),
    error: consoleFn('error', onIo),
  }
}

const special = 'application/in-process-js'

export default class Session {
  constructor(id) {
    this.id = id
    this.variables = {}
    this.frame = document.createElement('iframe')
    Object.assign(this.frame.style, {
      visibility: 'hidden',
      width: 0,
      height: 0,
    })
    document.body.appendChild(this.frame)
    Object.assign(this.frame.contentWindow, {
      React: require('react'),
      Jupyter: require('@jupyterlab/services'),
    })
  }

  isConnected() {
    return true
  }

  execute(code: string, onIo: (io: any) => void): Promise<any> {
    const ctx = this.frame.contentWindow
    ctx.console = makeConsole(onIo)
    ctx.display = (data, contentType = special) => {
      onIo({
        type: 'display',
        data: { [contentType]: data },
      })
    }
    return Promise.resolve()
      .then(() => ctx.eval(code))
      .then(val => {
        ctx.___ = ctx.__
        ctx.__ = ctx._
        ctx._ = val
        onIo({
          type: 'result',
          data: {[special]: val},
        })
      }, err => {
        onIo({
          type: 'error',
          name: err.constructor.name,
          message: err.message,
        })
      })
  }

  restart() {
    this.frame.parentNode.removeChild(this.frame)
    this.frame = document.createElement('iframe')
    document.body.appendChild(this.frame)
  }

  getCompletion({code, cursor, pos}) {
    const prev = code.slice(0, pos)
    const text = prev.match(/[\w\.]*$/)[0] // TODO maybe also get [] and ""?
    if (!text.length) return []
    const parts = text.split('.')
    return {
      list: this.completionsForPath(parts.slice()),
      from: {line: cursor.line, ch: cursor.ch - parts[parts.length - 1].length},
      to: cursor,
    }
  }

  completionsForPath(path) {
    let obj = this.frame.contentWindow
    const last = path.pop()
    while (obj && path.length) {
      obj = obj[path.shift()]
    }
    if (!obj || typeof obj !== 'object') return []
    const names = Object.getOwnPropertyNames(obj)
    if (obj.constructor) names.unshift('constructor')
    while (obj.__proto__) {
      names.push(...Object.getOwnPropertyNames(obj.__proto__))
      if (obj.__proto__.__proto__ === obj.__proto__) break
      obj = obj.__proto__
    }
    if (!last.length) return names
    return names.filter(n => n.startsWith(last))
  }

  interrupt() {
    // lol good luck
    // if it were a web worker, we could 'terminate', but that's it
  }

  shutdown() {
    this.frame.parentNode.removeChild(this.frame)
  }

  // TODO completion, etc. probably
  // also input() and stuff?
}


