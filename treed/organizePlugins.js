// @flow

const getSubThing = (plugins, sub, thing) => plugins
  .filter(p => p[sub] && p[sub][thing])
  .map(p => p[sub][thing])

const organizePlugins = plugins => {
  const classNameGetters = plugins.filter(p => p.node && p.node.className)
  .map(p => (node, store) => p.node.className(
    node.plugins[p.id],
    node,
    store
  ))
  const nodeTypes = {
    normal: {
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
    },
  }
}

export default organizePlugins
