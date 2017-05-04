
const makeCodeSettings = settings => {
  // TODO
}

const makeSettings = data => {
  const plugins = {}
  if (data.plugins.itreed) {
    plugins.code = makeCodeSettings(data.plugins.itreed)
  }
  return {
    _id: 'settings',
    created: data.created,
    modified: data.modified,
    plugins,
    views: {},
    version: 1,
    defaultViews: {
      root: {
        viewType: 'list',
        settings: {},
      },
    },
  }
}

const flattenTree = (parent, tree) => {
  return [{
    ...tree,
    parent,
    children: tree.children.map(child => child.id),
  }].concat(...tree.children.map(flattenTree.bind(null, tree.id)))
}

const makeDoc = node => {
  return {
    _id: node.id,
    created: node.created,
    modified: node.modified,
    parent: node.parent,
    children: node.children,
    type: node.type, // TODO translate type
    content: node.content,
    // TODO import plugins?
    plugins: {},
    // TODO import types
    types: {},
    views: {},
  }
}

module.exports = (id, filename, data) => {
  if (typeof data.root !== 'object' ||
      typeof data.title !== 'string' ||
      typeof data.windows !== 'object' ||
      typeof data.id !== 'string') {
    return
  }
  const meta = {
    id: id,
    title: data.title,
    lastOpened: data.opened,
    lastModified: data.modified,
    size: data.size,
    created: data.created,
    sync: null,
  }
  const settings = makeSettings(data)
  const docs = [settings].concat(flattenTree(null, data.root).map(makeDoc))

  return {meta, docs}
}

