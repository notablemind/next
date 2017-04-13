
import Session from './Session'

class Connection {
  constructor() {
    this.sessions = {}
    this.status = 'connected'
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
