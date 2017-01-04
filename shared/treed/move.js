
export const moveNext = (id, nodes, root, viewType) => {
  const pid = nodes[id].parent
  const sibs = nodes[pid].children
  const idx = sibs.indexOf(id)
  if (idx === sibs.length - 1) {
    if (pid === root) return
    const gpid = nodes[pid].parent
    const psibs = nodes[gpid].children
    const pidx = psibs.indexOf(pid)
    return {pid: gpid, idx: pidx + 1}
  }
  const nsib = nodes[sibs[idx + 1]]
  if (nsib.children.length && (!nsib.views[viewType] || !nsib.views[viewType].collapsed)) {
    return {pid: nsib._id, idx: 0}
  }
  return {pid, idx: idx + 1}
}

const isCol = (node, viewType) => node.views[viewType] && node.views[viewType].collapsed

export const lastChild = (id, nodes, viewType) => {
  const node = nodes[id]
  if (!node.children.length || isCol(node, viewType)) return id
  return lastChild(node.children[node.children.length - 1], nodes, viewType)
}

export const movePrev = (id, nodes, root, viewType) => {
  const pid = nodes[id].parent
  const sibs = nodes[pid].children
  const idx = sibs.indexOf(id)
  if (idx === 0) {
    if (pid === root) return
    const gpid = nodes[pid].parent
    const psibs = nodes[gpid].children
    const pidx = psibs.indexOf(pid)
    return {pid: gpid, idx: pidx}
  }
  const nsib = nodes[sibs[idx - 1]]
  if (nsib.children.length && !isCol(nsib, viewType)) {
    const npid = lastChild(nsib._id, nodes, viewType)
    return {pid: nodes[npid].parent, idx: -1}
  }
  return {pid, idx: idx - 1}
}


