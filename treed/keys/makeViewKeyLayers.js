import addKey from './addKey'

export default (config, namePrefix, userShortcuts, store) => {
  const layers = {
    insert: {prefixes: {}, actions: {}},
    normal: {prefixes: {}, actions: {}},
    visual: {prefixes: {}, actions: {}},
    // hmmm I wonder if there will ever be other modes...
  }
  Object.keys(config).forEach(name => {
    Object.keys(config[name].shortcuts).forEach(mode => {
      const shortcut = userShortcuts[namePrefix + name + '.' + mode] || config[name].shortcuts[mode]
      let action
      if (config[name].alias) {
        action = store.actions[config[name].alias]
        if (!action) {
          console.error(`Trying to alias to a nonexistant action: ${config[name].alias}`)
        }
      } else {
        let customAction = config[name].action
        if (!customAction) {
          console.error(`No action for ${name}`)
        }
        action = () => customAction(store)
      }
      addKey(layers[mode], shortcut, action)
    })
  })
  return layers
}

