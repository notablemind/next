
class Executor {
  constructor() {
    const vm = this.vm = require('vm')
    const builtins = require('./nodeBuiltins')
    // TODO spawn a child process probably?
    // or maybe just leave that up to jupyter
    const sandbox = this.sandbox = Object.assign({}, builtins, {
      console: {
        log(...args) {
        },
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
  }
}

module.exports = nm => {
  const vm = require('vm')
  const {ipcMain} = require('electron')
  const prom = IpcPromise(ipcMain)

  prom.on('code:execute', (evt, text) => main.execute(text))
}

