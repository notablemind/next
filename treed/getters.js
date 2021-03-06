export default {
  global: {
    node: (globalStore, id) => globalStore.db.data[id],
    nodePluginData: (globalStore, id, pluginId) =>
      globalStore.db.data[id].plugins[pluginId],
    pluginConfig: (globalStore, pluginId) => {
      const over = globalStore.pluginOverrides[pluginId]
      if (over) {
        return over
      }
      return globalStore.db.data.settings.plugins[pluginId]
    },
    pluginState: (globalStore, pluginId) =>
      globalStore.globalState.plugins[pluginId],
    clipboard: globalStore => globalStore.globalState.clipboard,
    searching: globalStore => globalStore.globalState.searching,

    viewSettings: (globalStore, viewType) =>
      globalStore.db.data.settings.views[viewType],
    defaultView: (globalStore, id) =>
      globalStore.db.data.settings.defaultViews[id],
  },

  view: {
    // @override from global
    viewSettings: store => store.db.data.settings.views[store.state.viewType],

    contextMenu: store => store.state.contextMenu,
    activeNode: store => store.db.data[store.state.active],
    root: store => store.state.root,
    active: store => store.state.active,
    mode: store => store.state.mode,
    sharedViewData: store => store.sharedViewData,
    isActiveView: store => store.id === store.globalState.activeView,
    isActive: (store, id) => id === store.state.active,
    // TODO check selection
    isDragging: (store, id) =>
      id === store.state.active && store.state.mode === 'dragging',
    isCutting: (store, id) => id === store.globalState.cut,
    isSelected: (store, id) => false, // TODO selection
    editState: (store, id) =>
      store.state.mode === 'insert' && id === store.state.active
        ? store.state.editPos
        : null,
    viewState: store => store.state.view,

    viewType: store => store.state.viewType,
    dropping: store =>
      store.state.mode === 'dropping' && store.globalState.dropping,
    nodeViewData: (store, id) =>
      store.db.data[id] && store.db.data[id].views[store.state.viewType],
  },
}
