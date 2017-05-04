const dragger = (e, fns) => {
  e.preventDefault()
  e.stopPropagation()
  const ox = e.clientX
  const oy = e.clientY
  const move = e => {
    e.preventDefault()
    e.stopPropagation()
    fns.move(ox, oy, e.clientX - ox, e.clientY - oy)
  }
  const stop = e => {
    fns.done(ox, oy, e.clientX - ox, e.clientY - oy)
    cleanup()
  }
  const cleanup = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)

  return cleanup
}

export default dragger
