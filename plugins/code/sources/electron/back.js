
const ipcPromise = require('./ipcPromise')

const consoleFn = (level, onIo) => {
  return (...args) => {
    onIo({
      type: 'console',
      level,
      args, // TODO make sure it's jsonifiable?
    })
  }
}

class Executor {
  constructor(onIo) {
    const vm = this.vm = require('vm')
    const builtins = require('./nodeBuiltins')
    // TODO spawn a child process probably?
    // or maybe just leave that up to jupyter
    const sandbox = this.sandbox = Object.assign({}, builtins, {
      console: {
        log: consoleFn('log', onIo),
        warn: consoleFn('warn', onIo),
        error: consoleFn('error', onIo),
      },
    })
    sandbox.global = sandbox
    vm.createContext(sandbox)

    this.executionCount = 0
  }

  execute(text) {
    // TODO I want to be able to gradually display results
    // e.g. not send over the whole result if it's huge.
    // How should I go about that?

    const result = vm.runInContext(text, sandbox, {
      filename: 'input-' + executionCount,
      displayErrors: true,
    })

    return result
  }
}

module.exports = {
  id: 'code',
  init: nm => {
    const vm = require('vm')
    const {ipcMain} = require('electron')
    const prom = ipcPromise(ipcMain)

    const sessions = {}
    const latestId = {}

    prom.on('code:get-session', (evt, id) => {
      return sessions[id] ? {id} : null
    })

    prom.on('code:create-session', (evt, id) => {
      sessions[id] = new Executor(io => ipcMain.send('code:io', id, latestId[id], io))
      return {id}
    })

    prom.on('code:execute', (evt, sessionId, id, text) => {
      latestId[sessionId] = id
      return sessions[sessionId].execute(text)
    })
  }
}

