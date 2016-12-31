
import Remarkable from 'remarkable'

const rem = new Remarkable({
  linkify: true,
  breaks: true,
})
// TODO use different renderer for a single line block, vs a multi-line block
// maybe
rem.block.ruler.disable(['list', 'heading', 'deflist', 'lheading'])

// TODO maybe use some sort of LRU cache?
const renderCache = {}

export default text => {
  if (renderCache[text]) return renderCache[text]
  return (renderCache[text] = rem.render(text))
}

