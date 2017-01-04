
const searchShallow = (data, root, viewType, searchText, max) => {
  let queue = [root]
  const results = []
  let i = 0
  while (i < queue.length) {
    const node = data[queue[i]]
    // TODO allow custom search functions for diff nodes or sth?
    // I think I will want this - to search through jupyter results
    if (node.content.toLowerCase().indexOf(searchText) !== -1) {
      results.push(node)
      if (results.length > max) break
    }
    if (node.children.length) {
      queue = queue.concat(node.children)
    }
    /*
    if (node.children.length &&
        !(node.views[viewType] && node.views[viewType].collapsed)) {
      queue = queue.concat(node.children)
    }
    */
    i += 1
  }
  return results
}

export const shallowFromRoot = (store, searchText) => {
  return searchShallow(
    store.db.data,
    store.state.root,
    store.state.viewType,
    searchText,
    10,
  )
}

