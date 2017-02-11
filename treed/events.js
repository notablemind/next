
export default {
  global: {
    node: (globalStore, id) => 'node:' + id,
    activeView: (globalStore) => 'active-view',
    activeMode: (globalStore) => 'active-mode',
    settingsChanged: (globalStore) => 'node:settings',
    clipboardChanged: globalStore => 'clipboard',
    searching: globalStore => 'searching',
    // changed: () => 'changed',
    // TODO do I need this?
    // I guess maybe for db sync or something
    defaultView: (globalStore, id) => `default-view:${id}`,
  },

  view: {
    nodeView: (store, id) => `node:${id}:view:${store.id}`,
    contextMenu: store => `context-menu:${store.id}`,
    sharedViewData: store => `shared-view-data:${store.id}`,
    serializableState: store => `serializable-state:${store.id}`,

    activeNode: store => `active-node:${store.id}`,
    root: store => `root:${store.id}`,
    mode: store => `mode:${store.id}`,
    viewState: store => `view-state:${store.id}`,
    viewType: store => `view-type:${store.id}`,
    viewSettings: store => `view-settings:${store.id}`,
  }
}

