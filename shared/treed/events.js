
export default {
  global: {
    node: (globalStore, id) => 'node:' + id,
    activeView: (globalStore) => 'active-view',
    activeMode: (globalStore) => 'active-mode',
    settingsChanged: (globalStore) => 'node:settings',
    clipboardChanged: globalStore => 'clipboard',
    // changed: () => 'changed',
    // TODO do I need this?
    // I guess maybe for db sync or something
  },

  view: {
    nodeView: (store, id) => `node:${id}:view:${store.id}`,
    contextMenu: store => `context-menu:${store.id}`,

    activeNode: store => `active-node:${store.id}`,
    root: store => `root:${store.id}`,
    mode: store => `mode:${store.id}`,
  }
}

