
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
    if (i === 0) {
      node.classList.add('selected')
    }
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
  docNodes.forEach(
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
    return
  }
  if (e.keyCode === 9) { // Tab
    e.preventDefault()
    if (e.shiftKey) {
      if (selected > 0) {
        setSelected(selected - 1)
      } else {
        setSelected(docs.length - 1)
      }
    } else {
      if (selected < docs.length - 1) {
        setSelected(selected + 1)
      } else {
        setSelected(0)
      }
    }
  }
}

const sendBack = () => {
  ipcRenderer.send('quick-add', {text: input.value, doc: docs[selected].id})
}

let selected = 0
let docs = []
let docNodes

const input = document.getElementById('input')
input.onkeydown = onKeyDown
// input.onblur = closeWindow
input.focus()

document.getElementById('close').onclick = closeWindow

ipcRenderer.on('meta', (event, meta) => {
  docs = Object.keys(meta).map(id => meta[id])
    .sort((a, b) => b.lastOpened - a.lastOpened)
  console.log('got meta', meta)
  docNodes = makeDocNodes(docs)
})

