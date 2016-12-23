// @-flow

export default class ViewManager {
  actions: any
  db: any
  cmd: any
  emitter: any
  keys: any
  // viewState: any
  viewStores: any
  nextViewId: number
  config: any

  globalState: {
    activeView: number,
    plugins: {[key: string]: any},
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
  }
}
