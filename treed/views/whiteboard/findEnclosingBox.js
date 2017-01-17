
const findEnclosingBox = (selected: any, nodeMap: any) => {
  let box
  Object.keys(selected).forEach(id => {
    const rect = nodeMap[id].getBoundingClientRect()
    if (!box) {
      box = {
        left: rect.left,
        top: rect.top, right: rect.right, bottom: rect.bottom,
        width: 0,
        height: 0,
      }
    } else {
      box.left = Math.min(box.left, rect.left)
      box.right = Math.max(box.right, rect.right)
      box.top = Math.min(box.top, rect.top)
      box.bottom = Math.max(box.bottom, rect.bottom)
    }
  })
  if (!box) throw new Error('Nothing selected')
  box.width = box.right - box.left
  box.height = box.bottom - box.top
  return box
}

export default findEnclosingBox
