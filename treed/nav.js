
const lastChild = (id, nodes, view) => {
  const node = nodes[id]
  if (!node || !node.children.length || (node.views[view] && node.views[view].collapsed)) return id
  return lastChild(node.children[node.children.length - 1], nodes, view)
}

export const prev = (id, nodes, root, view) => {
  const node = nodes[id]
  if (!node) return
  if (!node.parent || !nodes[node.parent]) return
  if (id === root) return
  const sibs = nodes[node.parent].children
  const idx = sibs.indexOf(id)
  if (idx === -1) return
  return idx === 0 ? node.parent : lastChild(sibs[idx - 1], nodes, view)
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

export const next = (id, nodes, root, view) => {
  const node = nodes[id]
  if (!node) return
  if (node.children.length && (!node.views[view] || !node.views[view].collapsed)) {
    return node.children[0]
  }
  return nextSibRec(id, nodes, root)
}
