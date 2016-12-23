// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

const isAncestor = (pid, id, data) => {
  if (id === pid) return true
  if (!id) return false
  return isAncestor(pid, data[id].parent, data)
}

const maxLen = 30
const shortened = txt => {
  if (!txt || txt.length < maxLen) return txt
  return txt.slice(0, maxLen) + '...'
}

class MiniItem extends Component {
  state: {
    node: any,
    root: string,
    activePath?: bool,
  }
  _sub: any

  constructor({store, id}: any) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.node(id),
        store.events.root()
      ],
      store => ({
        node: store.getters.node(id),
        root: store.getters.root(),
        activePath: isAncestor(id, store.getters.root(), store.db.data),
      })
    )
    //const sfs = store =>
    //this.state = sfs(store)
    //this.state.activePath = isAncestor(id, this.state.root, store.db.data)
  }

  componentDidMount() {
    this._sub.start()
    // const {store, id} = this.props
    /*
    this._unsub = store.on(, () => {
      const state = sfs(store)
      //state.activePath = isAncestor(id, state.root, store.db.data)
      this.setState(state)
    })
    */
  }

  componentWillUnmount() {
    this._sub.stop()
    // this._unsub()
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
        {shortened(node.content) || '<blank>'}
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

export default class MiniMap extends Component {
  state: {
    root: string,
    activeView?: string,
  }
  _sub: any

  constructor({store}: any) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.activeView(),
      ],
      store => ({
        root: store.getters.root(),
      })
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
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

