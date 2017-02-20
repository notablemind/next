// @flow

import type {PluginSummary, Plugin, PluginNodeTypeConfig} from './types'

const getSubThing = (plugins: Array<Plugin<*, *>>, sub: string, thing: string) => plugins
  .filter(p => p[sub] && p[sub][thing])
  .map(p => p[sub][thing])

const getPluginThing = (plugins: Array<Plugin<*, *>>, sub: string, thing: string) => plugins
  .filter(p => p[sub] && p[sub][thing])
  .map(p => (node, store) => p[sub][thing](
    node.plugins[p.id],
    node,
    store
  ))

const typesContextMenu = (node, store) => {
  const children = Object.keys(store.plugins.nodeTypes).map(key => {
    const ntype = store.plugins.nodeTypes[key]
    return {
      text: ntype.title || key,
      radioChecked: node.type === key,
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


const organizePlugins = (pluginSettings: {[pluginId: string]: any}, plugins: {[pluginId: string]: Plugin<*, *>}): PluginSummary => {
  const enabledPlugins = Object.keys(pluginSettings).map(id => plugins[id])
  const classNameGetters = getPluginThing(enabledPlugins, 'node', 'className')
  const contextMenuFns = getPluginThing(enabledPlugins, 'node', 'contextMenu')

  const nodeTypes: {[key: string]: PluginNodeTypeConfig<any>} = {
    normal: {
      title: 'Text',
      newSiblingsShouldCarryType: true,
      shortcut: 'n',
      render: null,
      // TODO anything here?
    },
  }
  enabledPlugins.forEach(plugin => {
    const pnodeTypes = plugin.nodeTypes
    if (!pnodeTypes) return
    Object.keys(pnodeTypes).forEach(type => {
      if (nodeTypes[type]) {
        console.error(`Multiple plugins want to own ${type}: ${plugin.id} is overriding`)
      }
      nodeTypes[type] = pnodeTypes[type]
    })
  })

  return {
    nodeTypes,
    node: {
      className: classNameGetters.length === 1 ? classNameGetters[0] :
        (classNameGetters.length === 0 ? null :
         (node, store) => classNameGetters.map(f => f(node, store)).join(' ')),
      pasteFile: getSubThing(enabledPlugins, 'node', 'pasteFile'),
      pasteSpecial: getSubThing(enabledPlugins, 'node', 'pasteSpecial'),
      dropFileNew: getSubThing(enabledPlugins, 'node', 'dropFileNew'),
      dropFileOnto: getSubThing(enabledPlugins, 'node', 'dropFileOnto'),
      contextMenu: [typesContextMenu].concat(contextMenuFns),
    },
    actionButtons: enabledPlugins.filter(p => p.actionButtons).map(p => ({id: p.id, buttons: p.actionButtons})),
  }
}

export default organizePlugins
