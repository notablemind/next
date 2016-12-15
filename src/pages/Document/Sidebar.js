// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import MiniMap from './MiniMap'
import Themer from './Themer'

type Store = any

export default class Sidebar extends Component {
  state: {
    store: Store
  }
  _unsub: () => void

  constructor({treed}: any) {
    super()
    this.state = {store: treed.activeView()}
    this._unsub = treed.on([treed.viewManager.config.events.activeView()], () => {
      this.setState({store: treed.activeView()})
    })
  }
  componentWillUnmount() {
    this._unsub()
  }
  render() {
    if (!this.state.store) return <div>Loading...</div>
    return <div className={css(styles.container)}>
      <MiniMap store={this.state.store} />
      <Themer store={this.state.store} />
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
