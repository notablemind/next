const actions = {
  lineNodesUpHorizontally(
    store: Store,
    ids: Array<string> = Object.keys(store.state.selected),
  ) {
    const boxes = ids.map(id => [
      id,
      store.state.nodeMap[id].getBoundingClientRect(),
    ])
    boxes.sort((a, b) => a[1].left - b[1].left)
    const owhite = store.db.data[boxes[0][0]].views.whiteboard || {x: 0, y: 0}
    let x = owhite.x + boxes[0][1].width + 5
    const y = owhite.y
    const updates = boxes.slice(1).map(([id, box], i) => {
      const node = store.db.data[id]
      const mx = x
      x += box.width + 5
      return {
        views: {
          ...node.views,
          whiteboard: {
            ...node.views.whiteboard,
            x: mx,
            y,
          },
        },
      }
    })
    store.actions.updateMany(boxes.slice(1).map(item => item[0]), updates)
  },

  lineNodesUpVertically(
    store: Store,
    ids: Array<string> = Object.keys(store.state.selected),
  ) {
    const boxes = ids.map(id => [
      id,
      store.state.nodeMap[id].getBoundingClientRect(),
    ])
    boxes.sort((a, b) => a[1].top - b[1].top)
    const owhite = store.db.data[boxes[0][0]].views.whiteboard || {x: 0, y: 0}
    const x = owhite.x
    let y = owhite.y + boxes[0][1].height + 5
    //const x = boxes[0][1].left
    //let y = boxes[0][1].top
    const updates = boxes.slice(1).map(([id, box], i) => {
      const node = store.db.data[id]
      const my = y
      y += box.height + 5
      return {
        views: {
          ...node.views,
          whiteboard: {
            ...node.views.whiteboard,
            x,
            y: my,
          },
        },
      }
    })
    store.actions.updateMany(boxes.slice(1).map(item => item[0]), updates)
  },
}

export default actions
