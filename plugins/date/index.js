
import type {Plugin} from 'treed/types'

const PLUGIN_ID = 'date'

const formats = {
  'simple': 'mm/dd/yyyy',
  // 'full': '
}

const plugin: Plugin<void, void> = {
  id: PLUGIN_ID,
  title: 'Date',

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

