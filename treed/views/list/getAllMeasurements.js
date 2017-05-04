// @flow

const preWalk = (isRoot, nodes, root, isCollapsed, fn) => {
  const node = nodes[root]
  const hasOpenChildren =
    node.children.length > 0 && (!isCollapsed(root) || isRoot)
  const res = fn(root, hasOpenChildren)
  if (res === false) return // don't traverse
  if (hasOpenChildren) {
    nodes[root].children.forEach(child =>
      preWalk(false, nodes, child, isCollapsed, fn),
    )
  }
}

const getAllMeasurements = (
  nodes: *,
  divs: *,
  isCollapsed: (id: string) => boolean,
  root: string,
  moving?: string,
) => {
  const measurements = []
  preWalk(true, nodes, root, isCollapsed, (id, hasOpenChildren) => {
    measurements.push([
      id,
      divs[id].getBoundingClientRect(),
      id === moving ? false : hasOpenChildren,
    ])
    if (id === moving) return false
  })
  return measurements
}

export default getAllMeasurements
