const calcChildInsertPos = (boxes, x, y) => {
  for (let box of boxes) {
    if (box.left <= x && x <= box.right && box.top <= y && y <= box.bottom) {
      let idx = 0
      for (; idx < box.children.length; idx++) {
        if (idx === box.children.length - 1) break
        if ((box.children[idx + 1] + box.children[idx]) / 2 >= y) {
          break
        }
      }
      return {
        insertPos: {idx, pid: box.id},
        indicator: {
          left: box.left + 15,
          width: box.right - box.left - 30,
          // right: box.right - 5,
          top: box.children[idx],
        },
      }
    }
  }
  return {insertPos: null, indicator: null}
}

export default calcChildInsertPos
