
export default {
  node: (store, id) => 'node:' + id,
  nodeView: (store, id) => `node:${id}:view:${store.id}`,

  activeView: () => 'active-view',
  activeNode: store => `active-node:${store.id}`,
  root: store => `root:${store.id}`,
  mode: store => `mode:${store.id}`,
  activeMode: () => 'active-mode',
  settingsChanged: () => 'node:settings',
  // changed: () => 'changed',
    // TODO do I need this?
    // I guess maybe for db sync or something
}

