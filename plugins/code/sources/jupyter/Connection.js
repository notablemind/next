import {Kernel} from '@jupyterlab/services'
import Session from './Session'

const timeout = (prom, val) => new Promise((res, rej) => {
  prom.then(res, rej)
  setTimeout(() => rej(new Error(`Timeout after ${val}ms`)), val)
})

export default class Connection {
  constructor(config) {
    this.config = config
    this.sessions = {}
    this.status = 'uninitialized'
    this.kernelOptions = {baseUrl: config.host}
  }

  init() {
    return timeout(Kernel.getSpecs(this.kernelOptions), 500).then(() => {
      this.status = 'connected'
    }, err => {
      this.status = 'disconnected'
    })
  }

  getKernelSpecs() {
    return Kernel.getSpecs(this.kernelOptions).then(({kernelspecs}) => Object.values(kernelspecs))
  }

  getSession(id) {
    return Kernel.connectTo(id, this.kernelOptions).then(kernel => new Session(kernel))
      .catch(err => null)
  }

  createSession(spec) {
    return Kernel.startNew({...this.kernelOptions, name: spec.name})
      .then(kernel => new Session(kernel))
  }
}

