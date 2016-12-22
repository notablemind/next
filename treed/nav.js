
const isCol = (node, viewType) => node.views[viewType] && node.views[viewType].collapsed

const lastChild = (id, nodes, viewType) => {
  const node = nodes[id]
  if (!node || !node.children.length || isCol(node, viewType)) return id
  return lastChild(node.children[node.children.length - 1], nodes, viewType)
}

export const prev = (id, nodes, root, viewType) => {
  const node = nodes[id]
  if (!node) return
  if (!node.parent || !nodes[node.parent]) return
  if (id === root) return
  const sibs = nodes[node.parent].children
  const idx = sibs.indexOf(id)
  if (idx === -1) return
  return idx === 0 ? node.parent : lastChild(sibs[idx - 1], nodes, viewType)
}

export const prevSib = (id, nodes) => {
  const node = nodes[id]
  if (!node) return
  if (!node.parent || !nodes[node.parent]) return
  const sibs = nodes[node.parent].children
  const idx = sibs.indexOf(id)
  if (idx === -1 || idx === 0) return
  return sibs[idx - 1]
}

export const nextSib = (id, nodes) => {
  const node = nodes[id]
  if (!node) return
  if (!node.parent || !nodes[node.parent]) return
  const sibs = nodes[node.parent].children
  const idx = sibs.indexOf(id)
  if (idx === -1 || idx === sibs.length - 1) return
  return sibs[idx + 1]
}

export const nextSibRec = (id, nodes, root) => {
  if (id === root) return
  const node = nodes[id]
  if (!node) return
  if (!node.parent || !nodes[node.parent]) return
  const sibs = nodes[node.parent].children
  const idx = sibs.indexOf(id)
  if (idx === -1) return
  if (idx < sibs.length - 1) return sibs[idx + 1]
  return nextSibRec(node.parent, nodes, root)
}

export const next = (id, nodes, root, viewType) => {
  const node = nodes[id]
  if (!node) return
  if (node.children.length && (id === root || !isCol(node, viewType))) {
    return node.children[0]
  }
  return nextSibRec(id, nodes, root)
}

export const last = (id, nodes, viewType) => {
  const node = nodes[id]
  if (!node.children.length || isCol(node, viewType)) return id
  return last(node.children[node.children.length - 1], nodes, viewType)
}
