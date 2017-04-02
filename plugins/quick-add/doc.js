
const {remote, ipcRenderer} = require('electron')
const win = remote.getCurrentWindow()

const closeWindow = () => {
  win.hide()
  setTimeout(() =>  {
    win.close()
  }, 500)
}

const makeDocNodes = docs => {
  const container = document.getElementById('docs')
  container.innerHTML = ''
  return docs.map((doc, i) => {
    const node = document.createElement('div')
    node.className = 'doc'
    node.innerText = doc.title
    node.onmousedown = e => {
      e.preventDefault()
      setSelected(i)
    }
    container.appendChild(node)
    return node
  })
}

const setSelected = index => {
  destNodes.forEach(
    (node, i) => node.classList.toggle('selected', i === index)
  )
  selected = index
}

const onKeyDown = e => {
  if (e.keyCode === 27) { // escape
    closeWindow()
  }
  if (e.keyCode === 13) { // enter
    if (e.shiftKey) return
    e.preventDefault()
    sendBack()
    closeWindow()
  }
  if (e.keyCode === 9) { // Tab
    e.preventDefault()
    if (e.shiftKey) {
      if (selected > 0) {
        setSelected(selected - 1)
      } else {
        setSelected(destinations.length - 1)
      }
    } else {
      if (selected < destinations.length - 1) {
        setSelected(selected + 1)
      } else {
        setSelected(0)
      }
    }
  }
}

let selected = 0
let docs = []
let destNodes = makeDestNodes(destinations)

const input = document.getElementById('input')
input.onkeydown = onKeyDown
// input.onblur = closeWindow
input.focus()

ipcRenderer.on('meta', (event, meta) => {
  Object.keys(meta).forEach(id => {

  })
})

