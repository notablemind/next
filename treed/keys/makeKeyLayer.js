
import addKey from './addKey'

export default (config, namePrefix, userShortcuts) => {
  const layer = {
    prefixes: {},
    actions: {},
  }
  Object.keys(config).forEach(name => {
    const shortcut = userShortcuts[namePrefix + name] || config[name].shortcut
    addKey(layer, shortcut, config[name].action)
  })
  return layer
}

