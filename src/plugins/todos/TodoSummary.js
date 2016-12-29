// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Content from '../../../treed/views/body/Content'

const walk = (id, nodes, visit) => {
  const children = nodes[id].children
  visit(nodes[id])
  children.forEach(id => walk(id, nodes, visit))
}

const trackChildren = (id, store, onChange, onChildChange) => {
  let nodes = {}
  const oldChildren = store.db.data[id].children
  const listener = () => {
    const children = store.db.data[id].children
    if (children !== oldChildren) {
      const nnodes = {}
      // add new
      children.forEach(child => {
        if (nodes[child]) {
          nnodes[child] = nodes[child]
        } else {
          let childNode = store.db.data[child]
          const childListener = () => {
            const newNode = store.db.data[child]
            onChildChange(childNode, newNode)
            childNode = newNode
          }
          nnodes[child] = childListener
          store.addListener(store.events.node(child), childListener)
        }
      })
      // remove old
      for (let name in nodes) {
        if (!nnodes[name]) {
          store.removeListener(store.events.node(name), nodes[name])
        }
      }
      nodes = nnodes
      onChange()
    }
  }
  store.addListener(store.events.node(id), listener)
  return () => {
    store.removeListener(store.events.node(id), listener)
    for (let name in nodes) {
      store.removeListener(store.events.node(name), nodes[name])
    }
  }
}

const trackDescendents = (id, store, onChange) => {
  const listeners = {}
  const nodes = {}

  // let _tout = null
  // let forgetting = {}
  // forgetting[id] = true

  const stopListening = id => {
    walk(id, nodes, node => {
      store.removeListener(store.events.node(node._id), listeners[node._id])
      listeners[node._id] = null
      nodes[node._id] = null
    })
  }

  const walkAndListen = id => {
    walk(id, store.db.data, node => {
      nodes[node._id] = node // TODO it would be nice if I didn't have to duplicate
      let children = new Set(node.children)

      const listener = () => {
        const nnode = store.db.data[node._id]
        const newChildren = new Set(nnode.children)
        // child removal
        nnode.children.forEach(id => {
          if (!children.has(id)) {
            walkAndListen(id)
          }
        })
        node.children.forEach(id => {
          if (!newChildren.has(id)) {
            onChange(null, nodes[id])
            stopListening(id)
          }
        })
        onChange(nnode, node)

        children = newChildren
        node = nnode
        nodes[node._id] = nnode
      }

      listeners[node._id] = listener
      store.addListener(store.events.node(node._id), listener)
      onChange(node, null)
    })

  }

  walkAndListen(id)

  return () => {
    Object.keys(listeners).forEach(id => {
      store.removeListener(store.events.node(id), listeners[id])
    })
  }
}

/**
 * handling descendents
 *(node, oldNode) => {
      if (!oldNode) { // addition
        if (node.type === 'todo') {
          total += 1
          if (node.types.todo && node.types.todo.done) {
            done += 1
          }
          enqueueUpdate()
        }
      } else if (!node) { // removal
        if (oldNode.type === 'todo') {
          total -= 1
          if (oldNode.types.todo.done) {
            done -= 1
          }
          enqueueUpdate()
        }
      } else {
        if (node.type === 'todo' && oldNode.type !== 'todo') {
          total += 1
          if (node.types.todo.done) {
            done += 1
          }
          enqueueUpdate()
        } else if (node.type !== 'todo' && oldNode.type === 'todo') {
          total -= 1
          if (oldNode.types.todo.done) {
            done -= 1
          }
          enqueueUpdate()
        } else if (node.type === 'todo') {
          if (node.types.todo.done && !oldNode.types.todo.done) {
            done += 1; enqueueUpdate()
          } else if (!node.types.todo.done && oldNode.types.todo.done) {
            done -= 1; enqueueUpdate()
          }
        }
      }
    }
 *
 */

export default class TodoSummary extends Component {
  constructor({store, node}: any) {
    super()
    this.state = {
      total: 0,
      done: 0,
    }
  }

  componentDidMount() {
    let total = 0
    let done = 0

    let _tout = null
    const enqueueUpdate = () => {
      if (_tout) return
      _tout = setTimeout(() => {
        _tout = null
        this.setState({total, done})
      })
    }

    this._unsub = trackChildren(this.props.node._id, this.props.store, this.update, this.update)
    this.update()
  }

  componentWillUnmount() {
    this._unsub()
  }

  update = () => {
    let total = 0
    let done = 0
    const id = this.props.node._id
    const children = this.props.store.db.data[id].children
    children.forEach(child => {
      const node = this.props.store.db.data[child]
      if (node.type === 'todo') {
        total += 1
        if (node.types.todo.done) {
          done += 1
        }
      }
    })
    this.setState({total, done})
  }

  render() {
    return <div className={css(styles.container)}>
      <div className={css(styles.summary)}>
        {this.state.done}/{this.state.total}
      </div>
      <Content {...this.props} style={{flex: 1}}/>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summary: {
    margin: 6,
    padding: '2px 4px',
    borderRadius: 4,
    backgroundColor: '#eee',
    fontFamily: 'monospace',
    fontSize: 10,
  },
})

