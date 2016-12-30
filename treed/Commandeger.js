// @flow

type Command = {
  type: string,
  args: any,
}

type Change = {
  type: string,
  args: any,
  date: number,
  old: any,
  prom: Promise<void>,
}

type ViewId = number

type HistoryItem = {
  view: ?ViewId,
  preActive: ?string,
  postActive: ?string,
  date: number,
  changes: Array<Change>,
}

export default class Commandeger<Commands: {[key: string]: *}, Args: Array<*>> {
  history: Array<HistoryItem>
  setActive: (view: ViewId, id: string) => void
  commands: Commands
  histpos: number

  constructor(commands: Commands, setActive: (view: ViewId, id: string) => void) {
    this.history = []
    this.histpos = 0
    this.commands = commands
    this.setActive = setActive
    // TODO maybe transactions?
  }

  addCommands(commands: any) {
    this.commands = {
      ...this.commands,
      ...commands,
    }
  }

  undo = (args: Args) => {
    if (this.histpos <= 0) return
    this.histpos -= 1
    const last = this.history[this.histpos]
    const changes = this._undo(last.changes, args)
    if (last.view && last.preActive) {
      this.setActive(last.view, last.preActive)
    }
    return [].concat.apply([], changes.map(c => c.events || []))
  }

  redo = (args: Args) => {
    if (this.histpos >= this.history.length) return
    const last = this.history[this.histpos]
    this.histpos += 1
    const changes = this._redo(last.changes, args)
    if (last.view && last.postActive) {
      this.setActive(last.view, last.postActive)
    }
    return [].concat.apply([], changes.map(c => c.events || []))
  }

  execute(command: Command, args: Args, view: ?ViewId, preActive: ?string, postActive: ?string) {
    return this.executeMany([command], args, view, preActive, postActive)
  }

  // TODO care about the "prom"s?
  executeMany(commands: Array<Command>, args: Args, view: ?ViewId, preActive: ?string, postActive: ?string) {
    const date = Date.now()
    const changes = this._do(commands, args)
    this.history = this.history.slice(0, this.histpos).concat([{
      view,
      preActive,
      postActive,
      date,
      changes,
    }])
    this.histpos = this.history.length
    return {
      idx: this.histpos - 1,
      events: [].concat.apply([], changes.map(c => c.events || [])),
    }
  }

  append(idx: number, command: Command, args: Args) {
    return this.appendMany(idx, [command], args)
  }

  appendMany(idx: number, commands: Array<Command>, args: Args) {
    if (this.history.length < idx) return
    const changes = this._do(commands, args)
    this.history[idx].changes = this.history[idx].changes.concat(changes)
    return [].concat.apply([], changes.map(c => c.events || []))
  }

  _do(commands: Array<Command>, extra: Args) {
    return commands.map(config => ({
      ...config,
      ...this.commands[config.type].apply(config.args, ...extra),
      date: Date.now(),
    }))
  }

  _undo(changes: Array<Change>, extra: Args) {
    const res = []
    // gotta undo these backwards
    for (let i = changes.length - 1; i >= 0; i--) {
      res.push({
        ...changes[i],
        events: null,
        ...this.commands[changes[i].type].undo(changes[i].old, ...extra),
      })
    }
    return res
  }

  _redo(changes: Array<Change>, extra: Args) {
    return changes.map(config => ({
      ...config,
      events: null,
      ...(this.commands[config.type].redo ||
          this.commands[config.type].apply)(config.args, ...extra)
    }))
  }
}

