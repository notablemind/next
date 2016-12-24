import addKey from './addKey'

const addPluginKeys = (store, layers, plugins) => {
  const typeSpecific = {insert: {}, normal: {}, visual: {}}
  plugins.forEach(plugin => {
    if (plugin.nodeTypes) {
      Object.keys(plugin.nodeTypes).forEach(type => {
        const defn = plugin.nodeTypes[type]
        const action = () => {
          store.actions.setNodeType(store.state.active, type)
        }
        addKey(layers.normal, `t ${defn.shortcut}`, action)
        addKey(layers.insert, `alt+t ${defn.shortcut}`, action)

        if (defn.actions) {
          Object.keys(defn.actions).forEach(action => {
            const adef = defn.actions[action]
            Object.keys(adef.shortcuts).forEach(mode => {
              const scut = adef.shortcuts[mode]
              if (!typeSpecific[mode][scut]) {
                const byType = typeSpecific[mode][scut] = {}
                addKey(layers[mode], scut, () => {
                  const node = store.db.data[store.state.active]
                  if (node && byType[node.type]) {
                    // TODO I could do visual mode "apply to all" without much
                    // fuss here. I'll really want transactions though
                    byType[node.type](store, node)
                  } else {
                    console.warn("that shortcut isn't defined for this node type")
                    console.log(scut, node.type, byType)
                  }
                })
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