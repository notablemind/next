
const getScrollParent = node => {
  let parent = node.parentNode
  while (parent && parent.scrollHeight <= parent.offsetHeight) {
    parent = parent.parentNode
  }
  return parent
}

let scrolling = null
const smoothScroll = (node, target) => {
  clearInterval(scrolling)
  scrolling = setInterval(() => {
    const past = node.scrollTop
    const diff = target - past
    if (Math.abs(diff) < 5) {
      node.scrollTop += diff
      clearInterval(scrolling)
    } else {
      node.scrollTop += diff / 5
      if (node.scrollTop === past) {
        // we've reached a limit
        clearInterval(scrolling)
      }
    }
  }, 10)
}

window.addEventListener('wheel', () => {
  clearInterval(scrolling)
})

const ensureInView = (item, scrollTo=true, margin=100) => {
  const itemBox = item.getBoundingClientRect()
  const parent = getScrollParent(item)
  const parentBox = parent === document.body ? {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        bottom: window.innerHeight,
        right: window.innerWidth,
      } : parent.getBoundingClientRect()

  // TODO account for if node is taller than view

  // scroll down
  if (itemBox.bottom > parentBox.bottom - margin) {
    if (!scrollTo || itemBox.bottom < parentBox.bottom + margin) {
      // just jump immediately
      parent.scrollTop += itemBox.bottom - (parentBox.bottom - margin)
    } else {
      smoothScroll(parent, parent.scrollTop + (itemBox.bottom - (parentBox.bottom - margin)))
    }
  }
  // scroll up
  else if (itemBox.top < parentBox.top + margin) {
    if (!scrollTo || itemBox.top > parentBox.top - margin) {
      // just jump to it
      parent.scrollTop -= (parentBox.top + margin) - itemBox.top
    } else {
      smoothScroll(parent, parent.scrollTop - ((parentBox.top + margin) - itemBox.top))
    }
  }

}

export default ensureInView
