
export default parent => {
  const x = document.createElement('div')
  Object.assign(x.style, {
    width: '5px',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgb(255, 215, 255)',
    position: 'absolute',
    display: 'none',
    zIndex: 0,
  })
  parent.appendChild(x)

  const y = document.createElement('div')
  Object.assign(y.style, {
    height: '5px',
    left: 0,
    right: 0,
    backgroundColor: 'rgb(255, 215, 255)',
    position: 'absolute',
    display: 'none',
    zIndex: 0,
  })
  parent.appendChild(y)

  return {
    destroy() {
      x.parentNode.removeChild(x)
      y.parentNode.removeChild(y)
    },

    set(xsnap, ysnap) {
      if (xsnap !== null) {
        x.style.left = xsnap + 'px'
        x.style.display = 'block'
      } else {
        x.style.display = 'none'
      }
      if (ysnap !== null) {
        y.style.top = ysnap + 'px'
        y.style.display = 'block'
      } else {
        y.style.display = 'none'
      }
    },
  }
}

