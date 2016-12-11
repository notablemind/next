// @-flow

type Db = any
type Commandeger = any
type Plugins = any
type Emitter = any

export default class ViewManager {
  actions: any
  db: any
  cmd: any
  emitter: any
  // viewState: any
  viewStores: any
  nextViewId: number
  config: any

  globalState: {
    activeView: number,
  }

  constructor(
    db: Db,
    cmd: Commandeger,
    emitter: Emitter,
    config: {
      actions: any,
      getters: any,
      events: any,
      plugins: any,
    }
  ) {
    this.db = db
    this.cmd = cmd
    this.emitter = emitter
    this.config = config
    // this.viewState = {}
    this.viewStores = {}
    this.nextViewId = 1
    this.globalState = {
      activeView: 1,
    }
  }

  get activeView() {
    return this.viewStores[this.globalState.activeView]
  }

  unregisterView(id) {
    delete this.viewStores[id]
    if (id === this.globalState.activeView) {
      this.globalState.activeView = +Object.keys(this.viewStores)[0]
      this.emitter.emit(this.events.activeView())
    }
  }

  registerView(root: string, type: string) {
    const id = this.nextViewId++
    if (!root || !this.db.data[root]) root = 'root'

    const state = /*this.viewState[id] = */{
      id,
      root,
      active: root,
      selected: null,
      editPos: null,
      mode: 'normal',
      minorMode: null,
      type,
    }

    const events = {}
    const args = [this.db, events]
    const store = this.viewStores[id] = {
      id,
      events,
      getters: {},
      actions: {},
      emit: this.emitter.emit,
      state, // : this.viewState[id],
      globalState: this.globalState,
      db: this.db,

      on: (evts, fn) => {
        if (!Array.isArray(evts)) {
          evts = [evts]
        }
        evts.forEach(evt => this.emitter.on(evt, fn))
        return () => {
          evts.forEach(evt => this.emitter.off(evt, fn))
        }
      },

      undo: () => this.emitter.emitMany(this.cmd.undo(args)),
      redo: () => this.emitter.emitMany(this.cmd.redo(args)),
      execute: cmd => this.emitter.emitMany(this.cmd.execute(cmd, args).events),
      executeMany: cmds => this.emitter.emitMany(this.cmd.executeMany(cmds, args).events),
      append: (idx, cmd) => this.emitter.emitMany(this.cmd.append(idx, cmd, args)),
      appendMany: (idx, cmds) => this.emitter.emitMany(this.cmd.appendMany(idx, cmds, args)),
    }

    Object.keys(this.config.getters).forEach(name => {
      store.getters[name] = this.config.getters[name].bind(null, store)
    })

    Object.keys(this.config.events).forEach(name => {
      store.events[name] = this.config.events[name].bind(null, store)
    })

    Object.keys(this.config.actions).forEach(name => {
      store.actions[name] = this.config.actions[name].bind(null, store)
    })
    return store
  }
}
