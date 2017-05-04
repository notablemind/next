
const dedup = ids => {
  const seen = {}
  return ids.filter(id => [!seen[id], seen[id]=true][0])
}

const fixedChildren = (id, nodes) =>
  dedup(nodes[id].children)
    .map(cid => typeof cid === 'string' ? cid : '' + cid)
    .filter(cid => !!nodes[cid] && nodes[cid].parent === id)

const checkParentage = (id, nodes, ids, updates) => {
  const children = fixedChildren(id, nodes)
  if (children.length !== nodes[id].children.length) {
    ids.push(id)
    updates.push({children})
  }
  children.forEach(child => checkParentage(child, nodes, ids, updates))
}

const walkNodes = (root, nodes, fn) => {
  fn(nodes[root])
  nodes[root].children.forEach(id => walkNodes(id, nodes, fn))
}

const plugin = {
  id: 'debug',
  title: 'Debug',

  actions: {
    walk(store, fn) {
      walkNodes(store.state.active, store.db.data, node => fn(node, store))
    },
  },

  quickActions(store, node) {
      const id = node._id
    return [{
      title: 'Fix children',
      id: 'fix_children',
      action() {
        const children = fixedChildren(id, store.db.data)
        store.actions.set(id, 'children', children)
      },
    }, {
      title: 'Audit tree',
      id: 'audit_tree',
      action() {
        const ids = []
        const updates = []
        checkParentage('root', store.db.data, ids, updates)
        console.log('updates', ids, updates)
        if (ids.length) {
          store.actions.updateMany(ids, updates)
        }
      }
    }]
  },
}

export default plugin

