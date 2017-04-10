// @flow

import type {Plugin} from 'treed/types'

const PLUGIN_ID = 'export'

const doCopy = ELECTRON ? (text) => {
  // TODO make web compatible
  const {clipboard} = require('electron')
  clipboard.writeText(text)
} : (text) => {
  alert('not impl yet')
}

const walk = (id, nodes, fn, level = 0) => {
  return fn(nodes[id], level, child => walk(child, nodes, fn, level + 1))
}

const head = num => {
  let txt = ''
  while (txt.length < num) txt += '#'
  return txt
}

const white = num => {
  let txt = ''
  while (txt.length < num) txt += ' '
  return txt
}

const exporters = {
  markdown(node, store, config) {
    const text = walk(node._id, store.db.data, (node, level, walk) => {
      const rest = node.children.map(walk).join('\n')
      if (level < config.headings) {
        return head(level + 1) + ' ' + node.content + '\n\n' + rest
      }
      if (level === config.headings && config.body) {
        return node.content + '\n\n' + rest
      }
      return white(level * 2) + '- ' + node.content + '\n' + rest
    })
    return text
  },
}

const plugin: Plugin<void, void> = {
  id: PLUGIN_ID,

  // TODO I want to show a modal where you can customize it probably
  node: {
    contextMenu: (pluginData, node, store) => {
      return {
        text: 'Export',
        children: [{
          text: 'Markdown list',
          action: () => {
            doCopy(exporters.markdown(node, store, {
              headings: 0,
              body: false,
            }))
          },
        }, {
          text: 'Markdown document',
          action: () => {
            doCopy(exporters.markdown(node, store, {
              headings: 3,
              body: true,
            }))
          }
        }, {
          text: 'Html list',
          action: () => {
            doCopy(exporters.html(node, store, {
              headings: 0,
              body: false,
            }))
          },
        }, {
          text: 'Html document',
          action: () => {
            doCopy(exporters.html(node, store, {
              headings: 3,
              body: true,
            }))
          },
        }],
      }
    },
  },
}
export default plugin
