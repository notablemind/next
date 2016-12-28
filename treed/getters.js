
export default {
  global: {
    node: (globalStore, id) => globalStore.db.data[id],
    nodePluginData: (globalStore, id, pluginId) =>
      globalStore.db.data[id].plugins[pluginId],
    pluginConfig: (globalStore, pluginId) =>
      globalStore.db.data.settings.plugins[pluginId],
    pluginState: (globalStore, pluginId) =>
      globalStore.globalState.plugins[pluginId],
    clipboard: globalStore => globalStore.globalState.clipboard,

    viewSettings: (globalStore, viewType) =>
      globalStore.db.data.settings.views[viewType]
  },

  view: {
    activeNode: store => store.db.data[store.state.active],
    root: store => store.state.root,
    active: store => store.state.active,
    mode: store => store.state.mode,
    isActiveView: store => store.id === store.globalState.activeView,
    isActive: (store, id) => id === store.state.active,
    isDragging: (store, id) => id === store.state.active &&
      store.state.mode === 'dragging',
    isCutting: (store, id) => id === store.globalState.cut,
    isSelected: (store, id) => false, // TODO selection
    editState: (store, id) => store.state.mode === 'insert' &&
      id === store.state.active ? store.state.editPos : null,
  },

}

