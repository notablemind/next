const isDomAncestor = (child, parent) => {
  if (child === parent) return true
  while (child.parentNode && child !== document.body) {
    child = child.parentNode
    if (child === parent) return true
  }
  return false
}

export default isDomAncestor
