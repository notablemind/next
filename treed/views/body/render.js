
import Remarkable from 'remarkable'

const rem = new Remarkable({
  linkify: true,
  breaks: true,
})

// TODO maybe use some sort of LRU cache?
const renderCache = {}

export default text => {
  if (renderCache[text]) return renderCache[text]
  return (renderCache[text] = rem.render(text))
}

