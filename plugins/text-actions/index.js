
const titleCase = text => text.replace(/\b\w/g, x => x.toUpperCase())

const plugin = {
  id: 'text-actions',
  title: 'Text Actions',

  quickActions(store, node) {
    return [{
      title: 'Upper case',
      id: 'upper_case',
      action() {
        store.actions.setContent(node._id, node.content.toUpperCase())
      },
    }, {
      title: 'Lower case',
      id: 'lower_case',
      action() {
        store.actions.setContent(node._id, node.content.toLowerCase())
      },
    }, {
      title: 'Title case',
      id: 'title_case',
      action() {
        store.actions.setContent(node._id, titleCase(node.content))
      },
    }, {
      title: 'Split lines',
      id: 'split_lines',
      action() {
        const lines = node.content.split(/\n/g).map(l => l.trim()).filter(l => l)
        const keep = lines.shift()
        let id = node._id
        store.actions.setContent(node._id, keep)
        lines.forEach(line => {
          id = store.actions.createAfter(id, line)
        })
        store.actions.normalMode()
      }
    }]
  },
}

export default plugin
