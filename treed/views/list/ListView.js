// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import ListItem from './ListItem'
import actions from './actions'

export default class ListView extends Component {
  state: any
  _unsub: () => void

  constructor(props: any) {
    super()
    const store = props.treed.registerView('root', 'list', actions)
    const stateFromStore = store => ({
      root: store.getters.root(),
    })
    this.state = {
      store: store,
      ...stateFromStore(store),
    }

    this._nodes = {}

    this._unsub = store.on([
      store.events.root(),
      // store.events.activeView(),
    ], () => this.setState(stateFromStore(store)))
  }

  componentWillUnmount() {
    this._unsub()
    this.props.treed.unregisterView(this.state.store.id)
  }

  render() {
    const root = this.state.store.state.root
    const depth = findDepth(root, this.state.store.db.data)
    return <div className={css(styles.container)}>
      <ListItem
        id={root}
        key={root}
        depth={depth}
        nodeMap={this._nodes}
        store={this.state.store}
      />
    </div>
  }
}

const findDepth = (id, data) => {
  if (id === 'root' || !id) return 0
  return 1 + findDepth(data[id].parent, data)
}


const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
})

