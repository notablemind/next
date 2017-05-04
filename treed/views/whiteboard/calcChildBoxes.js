const calcChildBoxes = (me, nodes, root, nodeMap, skip) => {
  return nodes[root].children.filter(id => !skip || !skip[id]).map(id => {
    const box = nodeMap[id].getBoundingClientRect()
    let childIds = nodes[id].children
    const children = childIds.length &&
      !(nodes[id].views.whiteboard && nodes[id].views.whiteboard.collapsed)
      ? nodes[id].children
          .map(id => nodeMap[id].getBoundingClientRect().top)
          .concat([box.bottom - 13 - 25])
      : [box.bottom - 10]
    return {
      id,
      top: box.top,
      left: box.left,
      right: box.right,
      bottom: box.bottom,
      children,
    }
  })
}

export default calcChildBoxes
