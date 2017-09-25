
const getNodes = (data, root, visit) => {
  const nodes = {}
  const inner = (id) => {
    nodes[id] = data[id]
    if (visit(nodes[id])) {
      nodes[id].children.forEach(inner)
    }
  }
  inner(root)
  return nodes
}

const trackDeep = (store, comp, root, visit) => {
  const listeners = {}

  const unlisten = key => {
    if (!listeners[key]) return
    listeners[key]()
    store.db.data[key].children.forEach(unlisten)
    // TODO remove from state nodes map
  }

  const listen = key => {
    if (listeners[key]) return

    listeners[key] = store.on([store.events.node(key)], () => {
      onChange(key)
    })
  }

  const onChange = key => {
    const onode = comp.state.nodes[key]
    const nnode = store.db.data[key]
    const old = visit(onode)
    const nww = visit(nnode)

    if (!old && nww) {
      nnode.children.forEach(listen)
    } else if (old && !nww) {
      onode.children.forEach(unlisten)
    } else if (old && nww) {
      // remove children that weren't there
      onode.forEach(child => {
        if (!nnode.children.includes(child)) {
          unlisten(child) // TODO how to make sure ordering is right if moved?
        }
      })
      // add children that are there
      nnode.children.forEach(listen)
    }

    comp.setState({
      nodes: {
        ...comp.state.nodes,
        [key]: store.db.data[key],
      },
    })
  }

  const nodes = getNodes(store.db.data, root, visit)
  Object.keys(nodes).forEach(listen)
  comp.state.nodes = nodes
}

export default trackDeep

