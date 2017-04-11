// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import type {GlobalConfig} from './defaultGlobalConfig'

const PLUGIN_ID = 'themes'

export default class IndividualStyles extends Component {
  state: {
    id: string,
    data: any,
  }
  _sub: any

  constructor({store}: any) {
    super()

    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.node(store.getters.active()),
        store.events.activeNode(),
      ],
      store => ({
        id: store.getters.active(),
        data: store.getters.nodePluginData(store.getters.active(), PLUGIN_ID) || {},
      }),
      store => store.getters.active() !== this.state.id,
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  toggle = key => {
    this.props.store.actions.setPluginData(this.state.id, PLUGIN_ID, {
      ...this.state.data,
      [key]: !this.state.data[key],
    })
  }

  render() {
    return <div>
      {Object.keys(this.props.styles).map(key => (
        <label key={key}
          className={css(styles.individualStyle)}
        >
          <input
            type="checkbox"
            checked={!!this.state.data[key]}
            onChange={() => this.toggle(key)}
          />
          <div className={css(styles.shortcut)}>
            {this.props.styles[key].shortcut}
          </div>
          {this.props.styles[key].name}
        </label>
      ))}
    </div>
  }
}

