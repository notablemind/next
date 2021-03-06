
import Session from './Session'

class Connection {
  constructor() {
    this.sessions = {}
    this.status = 'connected'
  }

  init() {
    return Promise.resolve()
  }

  getKernelSpecs() {
    return Promise.resolve([{
      language: 'javascript',
      display_name: 'Browser JS in iframe',
      name: 'browser-in-iframe',
    }])
  }

  getSession(id) {
    return Promise.resolve(this.sessions[id])
  }

  createSession() {
    const id = Math.random().toString(16).slice(2)
    this.sessions[id] = new Session(id)
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
