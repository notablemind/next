// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import MiniMap from './MiniMap'
// import Themer from './Themer'

type Store = any

export default class Sidebar extends Component {
  state: {
    store: Store
  }
  _unsub: () => void

  constructor({globalStore, plugins}: any) {
    super()
    this.state = {store: globalStore.activeView()}
  }

  componentWillMount() {
    this._unsub = this.props.globalStore.on([this.props.globalStore.events.activeView()], () => {
      this.setState({store: this.props.globalStore.activeView()})
    })
  }

  componentWillUnmount() {
    this._unsub()
  }

  render() {
    if (!this.state.store) return <div>Loading...</div>
    return <div className={css(styles.container)}>
      <MiniMap store={this.state.store} />
      {this.props.plugins.map(
        plugin => plugin.leftSidePane ?
          <plugin.leftSidePane store={this.state.store} key={plugin.id} /> :
          null
      )}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    width: 200,
    borderRight: '1px solid #ccc',
  },
})
