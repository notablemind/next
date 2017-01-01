
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import WhiteboardNode from './WhiteboardNode'

export default class WhiteboardRoot extends Component {
  constructor(props) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [store.events.root(), store.events.node(store.getters.root())],
      store => ({
        root: store.getters.root(),
        node: store.getters.node(store.getters.root()),
      }),
      store => store.getters.root() !== this.state.root,
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
      {this.state.node.children.map(child => (
        <WhiteboardNode
          id={child}
          key={child}
          store={this.props.store}
          nodeMap={this.props.nodeMap}
        />
      ))}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
  },
})

