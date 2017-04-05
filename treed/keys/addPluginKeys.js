// @-flow

import addKey from './addKey'
import addViewKeys from './addViewKeys'

const addPluginKeys = (store, layers, plugins) => {
  const typeSpecific = {insert: {}, normal: {}, visual: {}}
  const setNormalType = () => {
    store.actions.setNodeType(store.state.active, 'normal')
  }
  if (!layers.normal) layers.normal = {prefixes: {}, actions: {}}
  if (!layers.insert) layers.insert = {prefixes: {}, actions: {}}
  addKey(layers.normal, `t n`, setNormalType, 'Set type: Normal')
  addKey(layers.insert, `alt+t n`, setNormalType, 'Set type: Normal')
  plugins.forEach(plugin => {
    if (plugin.keys) {
      addViewKeys(layers, plugin.keys, `plugins.${plugin.id}.`, {}, store)
    }
    if (plugin.nodeTypes) {
      Object.keys(plugin.nodeTypes).forEach(type => {
        const defn = plugin.nodeTypes[type]
        const action = () => {
          store.actions.setNodeType(store.state.active, type)
        }
        const typeName = defn.title || type
        if (!defn.disableSwitch) {
          addKey(layers.normal, `t ${defn.shortcut}`, action, `Set type: ${typeName}`)
          addKey(layers.insert, `alt+t ${defn.shortcut}`, action, `Set type: ${typeName}`)
        }

        if (defn.actions) {
          Object.keys(defn.actions).forEach(action => {
            const adef = defn.actions[action]
            Object.keys(adef.shortcuts).forEach(mode => {
              const scut = adef.shortcuts[mode]
              if (!typeSpecific[mode][scut]) {
                const byType = typeSpecific[mode][scut] = {}
                if (!layers[mode]) layers[mode] = {prefixes: {}, actions: {}}
                addKey(layers[mode], scut, () => {
                  const node = store.db.data[store.state.active]
                  if (node && byType[node.type]) {
                    // TODO I could do visual mode "apply to all" without much
                    // fuss here. I'll really want transactions though
                    byType[node.type](store, node)
                  } else {
                    console.warn("that shortcut isn't defined for this node type")
                    console.log(scut, node.type, byType)
                    return false
                  }
                }, adef.description, true)
              }
              typeSpecific[mode][scut][type] = adef.action
            })
          })
        }
      })
    }
  })

}

export default addPluginKeys
