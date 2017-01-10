// @flow

import addKey from './addKey'

type Config = {
  [key: string]: {
    shortcut: string,
    action: Function,
    description: string,
  },
}

type UserShortcuts = {
  [key: string]: string,
}

export default (config: Config, namePrefix: string, userShortcuts: UserShortcuts) => {
  const layer = {
    prefixes: {},
    actions: {},
  }
  Object.keys(config).forEach(name => {
    const shortcut = userShortcuts[namePrefix + name] || config[name].shortcut
    addKey(layer, shortcut, config[name].action, config[name].description)
  })
  return layer
}

