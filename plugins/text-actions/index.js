
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
    }]
  },
}

export default plugin
