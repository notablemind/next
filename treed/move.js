
export const moveNext = (id, nodes, root, isCollapsed) => {
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
  if (nsib.children.length && !isCollapsed(nsib._id)) {
    return {pid: nsib._id, idx: 0}
  }
  return {pid, idx: idx + 1}
}

export const lastChild = (id, nodes, isCollapsed) => {
  const node = nodes[id]
  if (!node.children.length || isCollapsed(id)) return id
  return lastChild(node.children[node.children.length - 1], nodes, isCollapsed)
}

export const movePrev = (id, nodes, root, isCollapsed) => {
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
  if (nsib.children.length && !isCollapsed(nsib._id)) {
    const npid = lastChild(nsib._id, nodes, isCollapsed)
    return {pid: nodes[npid].parent, idx: -1}
  }
  return {pid, idx: idx - 1}
}


