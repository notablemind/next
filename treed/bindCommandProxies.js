
const bindCommandProxies = (store: any, commands, emitter, args, viewId: ?string) => {
  if (viewId) {
    store.execute = (cmd, preActive?: string=store.state.active,
                     postActive?: string=store.state.active) => {
      const res = commands.execute(cmd, args, store.id, preActive, postActive)
      emitter.emitMany(res.events)
      return res.idx
    }
    store.executeMany = (cmds, preActive?: string=store.state.active,
                         postActive?: string=store.state.active) => {
      const res = commands.executeMany(cmds, args, store.id, preActive, postActive)
      emitter.emitMany(res.events)
      return res.idx
    }
  } else {
    store.execute = cmd => {
      const res = commands.execute(cmd, args, null, null, null)
      emitter.emitMany(res.events)
      return res.idx
    }
    store.executeMany = cmds => {
      const res = commands.executeMany(cmds, args, null, null, null)
      emitter.emitMany(res.events)
      return res.idx
    }
  }

  store.append = (idx, cmd) =>
    emitter.emitMany(commands.append(idx, cmd, args))
  store.appendMany = (idx, cmds) =>
    emitter.emitMany(commands.appendMany(idx, cmds, args))
}

export default bindCommandProxies
