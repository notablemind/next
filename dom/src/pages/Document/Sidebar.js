// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

type Store = any

export default class Sidebar extends Component {
  props: {
    globalStore: any,
    plugins: Array<any>,
    side: 'left' | 'right',
  }
  state: {
    store: Store,
  }
  _unsub: () => void

  constructor({globalStore, plugins}: any) {
    super()
    this.state = {store: globalStore.activeView()}
  }

  componentWillMount() {
    this._unsub = this.props.globalStore.on(
      [this.props.globalStore.events.activeView()],
      () => {
        this.setState({store: this.props.globalStore.activeView()})
      },
    )
  }

  componentWillUnmount() {
    this._unsub()
  }

  render() {
    if (!this.state.store)
      return <div className={css(styles.container)}>Loading...</div>
    const side = this.props.side === 'right' ? 'rightSidePane' : 'leftSidePane'
    const items = this.props.plugins
      .map(plugin => {
        const Component = plugin[side]
        if (Component) {
          return <Component store={this.state.store} key={plugin.id} />
        }
      })
      .filter(x => !!x)
    if (!items.length) return null
    return (
      <div className={css(styles.container)}>
        {items}
      </div>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    // minWidth: 200,
    borderRight: '1px solid #ccc',
  },
})
