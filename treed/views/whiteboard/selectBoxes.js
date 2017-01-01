
const selectBoxes = (x, y, w, h, boxes, store) => {
  if (w < 0) {
    x += w
    w = -w
  }
  if (h < 0) {
    y += h
    h = -h
  }
  const oldSelected = store.state.selected || {}
  const selected = {}
  const events = []
  boxes.forEach(([id, box]) => {
    if (
      (x < box.left && box.left < x + w ||
      x < box.right && box.right < x + w ||
      box.left < x && x < box.right) &&
      (y < box.top && box.top < y + h ||
      y < box.bottom && box.bottom < y + h ||
      box.top < y && y < box.bottom)
    ) {
      if (!oldSelected[id]) {
        events.push(store.events.nodeView(id))
      }
      selected[id] = true
    } else if (oldSelected[id]) {
      events.push(store.events.nodeView(id))
    }
  })
  store.state.selected = selected
  if (events.length) {
    store.emitMany(events)
  }
}

export default selectBoxes
