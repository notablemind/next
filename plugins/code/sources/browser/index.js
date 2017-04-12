
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

class Session {
  constructor() {
    this.frame = document.createElement('iframe')
    document.body.appendChild(this.frame)
  }

  execute(code: string, onIo: (io: any) => void): Promise<any> {
    this.frame.contentWindow.console = makeConsole(onIo)
    this.frame.contentWindow.display = (data, contentType = 'application/in-process-js') => {
      onIo({
        type: 'display_data',
        data: { [contentType]: data },
      })
    }
    return Promise.resolve().then(() => this.frame.contentWindow.eval(code))
  }

  restart() {
    this.frame.parentNode.removeChild(this.frame)
    this.frame = document.createElement('iframe')
    document.body.appendChild(this.frame)
  }

  autoComplete() {
    // TODO
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

class Connection {
  constructor() {
    this.sessions = {}
  }

  getKernelSpecs() {
    return Promise.resolve([{
      language: 'javascript',
      name: 'Browser JS in iframe',
      id: 'browser-in-iframe',
    }])
  }

  getSession(id) {
    return Promise.resolve(this.sessions[id])
  }

  createSession(id) {
    this.sessions[id] = new Session()
    return Promise.resolve(this.sessions[id])
  }
}

const source = {
  id: 'browser',
  name: 'Browser in-process js',
  defaultConfig: {},
  Connection,
}

export default source
