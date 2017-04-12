
const ipcPromise = require('./ipcPromise')
const uuid = () => Math.random().toString(16).slice(2)

class Session {
  constructor(config) {
    this.config = config
    const {ipcRenderer} = require('electron')
    this.remote = ipcRenderer
    this.prom = ipcPromise(ipcRenderer)
    this.ios = {}
    this.latestIo = null
    this.remote.on('code:io', (id, data) => {
      if (!this.ios[id]) {
        if (this.latestIo && this.ios[this.latestIo]) {
          this.ios[this.latestIo](data)
        } else {
          console.log('no one to handle this io')
        }
        return
      }
      this.ios[id](data)
    })
  }

  execute(code: string, onIo: (io: any) => void): Promise<any> {
    const id = uuid()
    this.ios[id] = onIo
    const cleanup = () => {
      delete this.ios[id]
    }
    return this.prom.send('code:execute', id, code).then(val => {
      cleanup()
      return val
    }, err => {
      cleanup()
      throw err
    })
  }

}

class Connection {
  constructor() {
    const {ipcRenderer} = require('electron')
    this.remote = ipcRenderer
    this.prom = ipcPromise(ipcRenderer)
  }

  getKernelSpecs() {
    return Promise.resolve([{
      language: 'javascript',
      name: 'Electron in-process node',
      id: 'electron-in-process',
    }])
  }

  getSession(id) {
    return this.prom.send('code:get-session', id).then(config => {
      return config ? new Session(config) : null
    })
  }

  createSession(id) {
    return this.prom.send('code:create-session', id).then(config => {
      return new Session(config)
    })
  }
}

const source = {
  id: 'electron',
  name: 'Electron',
  defaultConfig: {},
  Connection,
}

export default source
