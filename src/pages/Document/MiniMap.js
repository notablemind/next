// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

const isAncestor = (pid, id, data) => {
  if (id === pid) return true
  if (!id) return false
  return isAncestor(pid, data[id].parent, data)
}

class MiniItem extends Component {
  state: {
    node: any,
    root: string,
    activePath?: bool,
  }
  _unsub: () => void

  constructor({store, id}: any) {
    super()
    const sfs = store => ({
      node: store.getters.node(id),
      root: store.getters.root(),
      activePath: false,
    })
    this.state = sfs(store)
    this.state.activePath = isAncestor(id, this.state.root, store.db.data)
    this._unsub = store.on([
      store.events.node(id),
      store.events.root()
    ], () => {
      const state = sfs(store)
      state.activePath = isAncestor(id, state.root, store.db.data)
      this.setState(state)
    })
  }

  componentWillUnmount() {
    this._unsub()
  }

  shouldComponentUpdate(_, nextState) {
    return nextState !== this.state
  }

  render() {
    const {depth, store, id} = this.props
    const {root, node, activePath} = this.state
    // if (!node.children.length) return null
    return <div>
      <div
        onClick={() => {
          store.actions.rebase(id)
          store.actions.setActive(id)
        }}
        className={css(
          styles.name,
          activePath && styles.activePath,
          root === id && styles.active,
        )}
      >
        {node.content || '<blank>'}
      </div>
      <div className={css(styles.children)}>
        {activePath && node.children.map(
          id => <MiniItem
            key={id}
            id={id}
            store={store}
            depth={depth + 1}
            root={root}
          />)}
      </div>
    </div>
  }
}

const stateFromStore = store => ({
  root: store.getters.root(),
})

const events = store => [
  store.events.root(),
  store.events.activeView(),
]

export default class MiniMap extends Component {
  state: {
    root: string,
    activeView?: string,
  }
  _unsub: () => void

  constructor({store}: any) {
    super()
    this.state = stateFromStore(store)
    this._unsub = store.on(events(store), () => this.setState(stateFromStore(store)))
  }

  componentWillUnmount() {
    this._unsub()
  }

  render() {
    return <div className={css(styles.container)}>
      <MiniItem
        root={this.state.root}
        id={"root"}
        store={this.props.store}
        depth={0}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    fontSize: 10,
  },

  children: {
    paddingLeft: 5,
    marginLeft: 5,
    borderLeft: '1px solid #ccc',
  },

  name: {
    cursor: 'pointer',
    padding: '2px 4px',
    ':hover': {
      outline: '1px solid #ccc',
    },
  },

  active: {
    backgroundColor: '#fcf',
  },
})

