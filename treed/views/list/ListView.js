// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import ListItem from './ListItem'
import actions from './actions'

export default class ListView extends Component {
  state: any
  _sub: any
  _nodes: {[key: string]: any}

  constructor(props: any) {
    super()
    const store = props.treed.registerView('root', 'list', actions)
    this._sub = store.setupStateListener(
      this,
      store => [store.events.root()],
      store => ({root: store.getters.root()}),
    )
    this.state.store = store

    this._nodes = {}
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
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

