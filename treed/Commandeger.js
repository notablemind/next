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

type HistoryItem = {
  date: number,
  changes: Array<Change>,
}

export default class Commandeger<Commands: {[key: string]: *}, Args: Array<*>> {
  history: Array<HistoryItem>
  commands: Commands
  histpos: number

  constructor(commands: Commands) {
    this.history = []
    this.histpos = 0
    this.commands = commands
    // this.changed = changed
    // this.setActive =
    // this._transaction_ix = null
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
    return [].concat.apply([], changes.map(c => c.events || []))
  }

  redo = (args: Args) => {
    if (this.histpos >= this.history.length) return
    this.histpos += 1
    const last = this.history[this.histpos]
    const changes = this._redo(last.changes, args)
    return [].concat.apply([], changes.map(c => c.events || []))
  }

  execute(command: Command, args: Args) {
    return this.executeMany([command], args)
  }

  // TODO care about the "prom"s?
  executeMany(commands: Array<Command>, args: Args) {
    const date = Date.now()
    const changes = this._do(commands, args)
    this.history = this.history.slice(0, this.histpos).concat([{
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
    return changes.map(config => ({
      ...config,
      events: null,
      ...this.commands[config.type].undo(config.old, ...extra),
    }))
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

