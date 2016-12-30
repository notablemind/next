// @flow

const getSubThing = (plugins, sub, thing) => plugins
  .filter(p => p[sub] && p[sub][thing])
  .map(p => p[sub][thing])

const typesContextMenu = (node, store) => {
  const children = Object.keys(store.plugins.nodeTypes).map(key => {
    const ntype = store.plugins.nodeTypes[key]
    return {
      text: ntype.title || key,
      checked: node.type === key,
      disabled: node.type === key,
      action: () => store.actions.setNodeType(node._id, key),
    }
  })
  const currentType = store.plugins.nodeTypes[node.type]
  const currentTitle = currentType && currentType.title || node.type
  return {
    text: 'Node type: ' + currentTitle,
    children,
  }
}

const organizePlugins = plugins => {
  const classNameGetters = plugins.filter(p => p.node && p.node.className)
  .map(p => (node, store) => p.node.className(
    node.plugins[p.id],
    node,
    store
  ))
  const contextMenuFns = plugins.filter(p => p.node && p.node.contextMenu)
  .map(p => (node, store) => p.node.contextMenu(
    node.plugins[p.id],
    node,
    store
  ))

  const nodeTypes = {
    normal: {
      title: 'Text',
      newSiblingsShouldCarryType: true,
      // TODO anything here?
    },
  }
  plugins.forEach(plugin => {
    Object.keys(plugin.nodeTypes || {}).forEach(type => {
      if (nodeTypes[type]) {
        console.error(`Multiple plugins want to own ${type}: ${plugin.id} is overriding`)
      }
      nodeTypes[type] = plugin.nodeTypes[type]
    })
  })

  return {
    nodeTypes,
    node: {
      className: classNameGetters.length === 1 ? classNameGetters[0] :
        (classNameGetters.length === 0 ? null :
         (node, store) => classNameGetters.map(f => f(node, store)).join(' ')),
      pasteFile: getSubThing(plugins, 'node', 'pasteFile'),
      dropFileNew: getSubThing(plugins, 'node', 'dropFileNew'),
      dropFileOnto: getSubThing(plugins, 'node', 'dropFileOnto'),
      contextMenu: [typesContextMenu].concat(contextMenuFns),
    },
  }
}

export default organizePlugins
