
import type {Plugin} from 'treed/types'

const PLUGIN_ID = 'date'

const formats = {
  'simple': 'mm/dd/yyyy',
  // 'full': '
}

const findInsertionPoint = (active, root, nodes) => {
  if (active === root) {
    return {pid: active, ix: -1}
  }
  const pid = nodes[active].parent
  if (nodes[active].type === 'date') {
    return {pid, ix: -1}
  }
  if (nodes[pid].type === 'date') {
    return {pid: nodes[pid].parent, ix: -1}
  }
  return {pid: active, ix: -1}
}

const plugin: Plugin<void, void> = {
  id: PLUGIN_ID,
  title: 'Date',

  actionButtons: {
    newEntry: {
      title: 'New entry',
      description: 'Add a date node',
      action: store => {
        const {pid, ix} = findInsertionPoint(
          store.state.active, store.state.root, store.db.data)
        const id = store.actions.create({
          fromNode: store.db.data[store.state.active],
          type: 'date',
          pid,
          ix,
        })
        store.actions.createChild(id)
      },
    },
  },

  nodeTypes: {
    date: {
      title: 'Date',
      newSiblingsShouldCarryType: false,
      shortcut: 'd',
      defaultNodeConfig() {
        return {
          showTime: false,
        }
      },

      // TODO use this somewhere
      textPreview(node) {
        return '<date>'
      },

      contextMenu(typeData, node, store) {
        const checked = node.types.date && node.types.date.showTime
        return [{
          text: 'Show time',
          checked,
          action: () => store.actions.setNested(
            node._id,
            ['types', 'date', 'showTime'],
            !checked
          ),
        }]
      },

    },
  },
}

export default plugin

