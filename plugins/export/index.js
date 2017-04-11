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

const stateWalk = (id, nodes, fn, state) => {
  return fn(nodes[id], state, (child, childState) => stateWalk(child, nodes, fn, childState))
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
  markdownList(node, store) {
    return walk(node._id, store.db.data, (node, level, walk) => {
      const rest = node.children.map(walk).join('\n')
      return white(level * 2) + '- ' + node.content + '\n' + rest
    })
  },

  markdownDocument(node, store) {
    return walk(node._id, store.db.data, (node, level, walk) => {
      if (node.type === 'header') {
        return head(level + 1) + ' ' + node.content + '\n\n' + node.children.map(walk).join('\n\n')
      } else if (node.type === 'orderedList') {
        return node.content + '\n\n' + node.children.map(
          id => '1. ' + walk(id).replace(/\n/, '\n   ')
        ).join('\n')
      } else if (node.type === 'list') {
        return node.content + '\n\n' + node.children.map(
          id => '- ' + walk(id).replace(/\n/, '\n  ')
        ).join('\n')
      } else {
        return node.content + (node.children.length ? '\n\n' + node.children.map(walk).join('\n\n') : '')
      }
    })
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
            doCopy(exporters.markdownList(node, store))
          },
        }, {
          text: 'Markdown document',
          action: () => {
            doCopy(exporters.markdownDocument(node, store))
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
