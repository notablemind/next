
export default {
  node: (store, id) => store.db.data[id],
  activeNode: store => store.db.data[store.state.active],
  root: store => store.state.root,
  active: store => store.state.active,
  isActiveView: store => store.id === store.globalState.activeView,
  isActive: (store, id) => id === store.state.active,
  isSelected: (store, id) => false, // TODO selection
  editState: (store, id) => store.state.mode === 'insert' &&
    id === store.state.active ? store.state.editPos : null,

  nodePluginData: (store, id, pluginId) => store.db.data[id].plugins[pluginId],
  pluginConfig: (store, pluginId) => store.db.data.settings.plugins[pluginId],
  pluginState: (store, pluginId) => store.globalState.plugins[pluginId]
}

