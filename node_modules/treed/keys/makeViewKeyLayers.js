// @flow

import addKey from './addKey'

import type {ViewActionConfig, Store, UserShortcuts} from '../types'

export default (config: ViewActionConfig, namePrefix: string, userShortcuts: UserShortcuts, store: Store) => {
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
      } else if (config[name].action) {
        let customAction = config[name].action
        if (!customAction) {
          console.error(`No action for ${name}`)
        }
        action = () => customAction(store)
      } else {
        throw new Error('Invalid shortcut config')
      }
      addKey(layers[mode], shortcut, action, config[name].description)
    })
  })
  return layers
}

