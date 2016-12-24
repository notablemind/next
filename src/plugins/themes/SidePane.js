// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import type ThemeSettings from './'


const PLUGIN_ID = 'themes'

class IndividualStyles extends Component {
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

export default class SidePane extends Component {
  state: ThemeSettings
  _sub: any
  constructor({store}: any) {
    super()
    // TODO re-subscribe if we switch active views!
    this._sub = store.setupStateListener(
      this,
      store => [store.events.settingsChanged()],
      store => store.getters.pluginConfig(PLUGIN_ID)
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  update(state: ThemeSettings) {
    this.props.store.actions.setGlobalPluginConfig(PLUGIN_ID, state)
    // this.props.store.getters.pluginState(PLUGIN_ID).preview(state)
    this.setState(state)
  }

  toggleHeaderEnabled(hi: number) {
    this.update({
      ...this.state,
      headerStyles: this.state.headerStyles.map(
        (h, i) => i === hi ? {...h, enabled: !h.enabled} : h
      ),
    })
  }

  render() {
    const {headerStyles, individualStyles} = this.state
    return <div className={css(styles.container)}>
      <div className={css(styles.title)}>
        Styling
      </div>
      <div className={css(styles.subTitle)}>
        Header styles
      </div>
      {headerStyles.map((hstyle, i) => (
        <div key={i}>
          <div>
            <label>
              <input
                checked={hstyle.enabled}
                type="checkbox"
                onChange={e => this.toggleHeaderEnabled(i)}
              />
              Level {hstyle.level}
            </label>
          </div>
        </div>
      ))}
      <div className={css(styles.subTitle)}>
        Individual styles
      </div>
      <IndividualStyles
        store={this.props.store}
        styles={individualStyles}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    borderTop: '1px solid #aaa',
    marginTop: 10,
    paddingTop: 5,
  },

  title: {
    padding: '3px 5px',
    fontWeight: 'bold',
  },

  individualStyle: {
    display: 'flex',
    flexDirection: 'row',
    padding: 2,
  },

  shortcut: {
    backgroundColor: '#ddd',
    textShadow: '1px 1px 0 white',
    fontFamily: 'monospace',
    padding: '2px 4px',
    borderRadius: 2,
    margin: '0 3px',
  },

  subTitle: {
    padding: '3px 5px',
    fontWeight: 'bold',
    fontSize: '.9em',
  },
})
