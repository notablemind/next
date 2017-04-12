
const populateOutputs = data => {
  const outputs = {}
  Object.keys(data).forEach(key => {
    if (data[key].type === 'code' && data[key].types.code && data[key].types.code.lastRun) {
      outputs[key] = data[key].types.code.lastRun.outputs
    }
  })
  return outputs
}

const makeSources = (sources, config) => {
  const result = {}
  sources.forEach(source => {
    result[source.id] = new source.Connection(config[source.id] || source.defaultConfig || {})
  })
  return result
}

export default class Manager {
  constructor(config, store, sources) {
    this.store = store
    this.outputs = populateOutputs(store.db.data)
    this.listeners = {}
    this.sources = makeSources(sources, config.sources)
  }

  init() {
    return Promise.resolve()
  }

  notify = id => {
    if (this.listeners[id]) {
      this.listeners[id].forEach(f => f(this.outputs[id]))
    }
  }

  execute = id => {
    const config = this.store.db.data[id].types.code
    if (!config || !config.kernelId) return console.error('no kernel configured')
    const kernel = this.kernels[config.kernelId]
    if (!kernel) return console.error('invalid kernel id')
    if (!kernel.isConnected()) return console.error('kernel not connected')
    this.outputs[id] = []
    kernel.execute(id, io => {
      this.outputs[id].push(io)
      this.notify(id)
    }).then(val => {
      this.outputs[id].push(val)
      this.notify(id)
    }, err => {
      this.outputs[id].push(err)
      this.notify(id)
    })
  }

  listen = (id, fn) => {
    if (!this.listeners[id]) this.listeners[id] = []
    this.listeners[id].push(fn)
    return () => {
      this.listeners[id] = this.listeners[id].filter(f => f !== fn)
    }
  }

  getOutputs = id => {
    return this.outputs[id]
  }
}

