// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Content from '../../../treed/views/body/Content'

const walk = (id, nodes, visit) => {
  const children = nodes[id].children
  visit(nodes[id])
  children.forEach(id => walk(id, nodes, visit))
}

const trackChildren = (id, store, onChange) => {
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

    this._unsub = trackChildren(this.props.node._id, this.props.store, (node, oldNode) => {
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
    })
  }

  componentWillUnmount() {
    this._unsub()
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

