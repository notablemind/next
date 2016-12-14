// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import MiniMap from './MiniMap'

export default class Sidebar extends Component {
  constructor({treed}: any) {
    super()
    this.state = {store: treed.activeView()}
    treed.on([treed.viewManager.config.events.activeView()], () => {
      this.setState({store: treed.activeView()})
    })
  }
  render() {
    if (!this.state.store) return <div>Loading...</div>
    return <div className={css(styles.container)}>
      <MiniMap store={this.state.store} />
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
