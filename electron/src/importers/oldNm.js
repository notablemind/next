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
    version: 2,
    defaultViews: {
      root: {
        viewType: 'list',
        settings: {}
      }
    }
  }
}

const flattenTree = (parent, tree) => {
  return [
    Object.assign({}, tree, {
      parent,
      children: tree.children.map(child => child.id)
    })
  ].concat(...tree.children.map(flattenTree.bind(null, tree.id)))
}

const typeOptions = {
  todo: node => ({}),
}

const importTypes = node => {
  if (node.type === 'normal' || node.type === 'base') return {}
  return {
    [node.type]: typeOptions[node.type] ? typeOptions[node.type](node) : {}
  }
}

const makeDoc = node => {
  return {
    _id: node.id,
    created: node.created,
    modified: node.modified,
    parent: node.parent,
    children: node.children,
    type: node.type === 'base' ? 'normal' : node.type, // TODO translate type
    content: node.content,
    completed: (node.done || node.disabled) ? node.modified : null,
    // TODO import plugins?
    plugins: {},
    types: importTypes(node),
    views: {}
  }
}

module.exports = (id, filename, data) => {
  if (
    typeof data.root !== 'object' ||
    typeof data.title !== 'string' ||
    typeof data.windows !== 'object' ||
    typeof data.id !== 'string'
  ) {
    return
  }
  const meta = {
    id: id,
    title: data.title,
    lastOpened: data.opened,
    lastModified: data.modified,
    size: data.size,
    created: data.created,
    sync: null
  }
  const settings = makeSettings(data)
  data.root.id = 'root'
  const nodes = flattenTree(null, data.root)
  const docs = [settings].concat(nodes.map(makeDoc))

  return {meta, docs}
}
