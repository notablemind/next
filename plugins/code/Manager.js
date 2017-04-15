
const populateOutputs = data => {
  const outputs = {}
  Object.keys(data).forEach(key => {
    if (data[key].type === 'code' && data[key].types.code && data[key].types.code.lastRun) {
      outputs[key] = data[key].types.code.lastRun.outputs
    }
  })
  return outputs
}

const populateStreams = data => {
  const streams = {}
  Object.keys(data).forEach(key => {
    if (data[key].type === 'code' && data[key].types.code && data[key].types.code.lastRun) {
      streams[key] = {...data[key].types.code.lastRun.streams}
    }
  })
  return streams
}

const makeSources = (sources, config) => {
  const result = {}
  sources.forEach(source => {
    result[source.id] = {
      source,
      connection: new source.Connection(config[source.id] || source.defaultConfig || {}),
      error: null,
    }
  })
  return result
}

const latestSessionForKernel = (docid, kernelid) => {
  return localStorage[`latest-kernel:${docid}:${kernelid}`] || null
}

const setLatestSessionForKernel = (docid, kernelid, sessionId) => {
  localStorage[`latest-kernel:${docid}:${kernelid}`] = sessionId
}

export default class Manager {
  constructor(docid, config, store, sources) {
    this.store = store
    this.docid = docid
    this.config = config
    this.outputs = populateOutputs(store.db.data)
    this.streams = populateStreams(store.db.data)
    this.listeners = {}
    this.sources = makeSources(sources, config.sources)
    this.kernelSessions = {}
    this.displayLanguages = ['javascript', 'python', 'swift'] // TODO maybe allow ppl to just enter their own?
    // Probably want an autocomplete actually
    // TODO listen to settings changes
    // this._unsub = store.
  }

  init() {
    const ids = Object.keys(this.config.kernels)
    // TODO do a source init first
    return Promise.all(ids.map(id => {
      const session = latestSessionForKernel(this.docid, id)
      const kern = this.config.kernels[id]
      const {connection} = this.sources[kern.sourceId]
      if (session) {
        return connection.getSession(session).then(session => session || connection.createSession(kern.config))
      } else {
        return connection.createSession(kern.config)
      }
    })).then(sessions => {
      this.kernelSessions = {}
      sessions.forEach((session, i) => {
        this.kernelSessions[ids[i]] = {
          kernelId: ids[i],
          sessionId: session.id,
          started: Date.now(), // TODO fix?
          busy: false,
          session,
        }
        setLatestSessionForKernel(this.docid, ids[i], session.id)
      })
    })
  }

  notify = id => {
    if (this.listeners[id]) {
      this.listeners[id].forEach(f => f(this.outputs[id], this.streams[id]))
    }
  }

  execute = id => {
    const node = this.store.db.data[id]
    const config = node.types.code
    const code = node.content
    if (!config || !config.kernelId) return console.error('no kernel configured')
    const kernel = this.kernelSessions[config.kernelId]
    if (!kernel) return console.error('invalid kernel id')
    if (!kernel.session.isConnected()) return console.error('kernel not connected')
    this.outputs[id] = []
    this.streams[id] = {stdout: '', stderr: ''}
    this.store.actions.setNested(id, ['types', 'code', 'lastRun'], {
      start: Date.now(),
      end: null,
      status: 'running',
      sessionId: kernel.sessionId,
      executionNumber: 0, // TODO
      outputs: [],
      streams: {},
    })
    kernel.session.execute(code, io => {
      console.log('io', io)
      this.outputs[id].push(io) // TODO type this
      this.notify(id)
    }, (stream, text) => {
      this.streams[id][stream] += text
      // TODO maybe preprocess for terminal stuffs?
      this.notify(id) // TODO debounce the notification probably
    }).then(() => {
      this.store.actions.updateNested(id, ['types', 'code', 'lastRun'], {
        end: Date.now(),
        outputs: this.outputs[id].slice(),
        streams: {...this.streams[id]},
        status: 'ok',
      })
    }, err => {
      console.log('fail', err)
      this.outputs[id].push({type: 'error', error: err})
      this.notify(id)
      this.store.actions.updateNested(id, ['types', 'code', 'lastRun'], {
        end: Date.now(),
        outputs: this.outputs[id].slice(),
        streams: {...this.streams[id]},
        status: 'err',
        // TODO include err, // TODO serialize somehow
      })
    }).catch(err => {
      console.log('faileduresfs', err)
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
  getStreams = id => {
    return this.streams[id]
  }
}

