
const selectBoxes = (x, y, w, h, boxes) => {
  const ids = []
  if (w < 0) {
    x += w
    w = -w
  }
  if (h < 0) {
    y += h
    h = -h
  }
  boxes.forEach(([id, box]) => {
    if (
      (x < box.left && box.left < x + w ||
      x < box.right && box.right < x + w ||
      box.left < x && x < box.right) &&
      (y < box.top && box.top < y + h ||
      y < box.bottom && box.bottom < y + h ||
      box.top < y && y < box.bottom)
    ) {
      ids.push(id)
    }
  })
  return ids
}

export default selectBoxes
