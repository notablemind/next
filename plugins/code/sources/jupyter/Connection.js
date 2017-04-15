import {Kernel} from '@jupyterlab/services'
import Session from './Session'

export default class Connection {
  constructor(config) {
    this.config = config
    this.sessions = {}
    this.status = 'connected'
    this.kernelOptions = {baseUrl: config.host}
  }

  init() {
    // TODO establish that the config is good.
    // probably a call to getKernelSpecs would do it
    return Promise.resolve()
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

