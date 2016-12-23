// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

const PLUGIN_ID = 'themes'

class IndividualStyles extends Component {
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
        >
          <input
            type="checkbox"
            checked={!!this.state.data[key]}
            onChange={() => this.toggle(key)}
          />
          {key}
        </label>
      ))}
    </div>
  }
}

export default class SidePane extends Component {
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

  update(state) {
    this.props.store.getters.pluginState(PLUGIN_ID).preview(state)
    this.setState(state)
  }

  toggleHeaderEnabled(hi) {
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
            Level {hstyle.level}
          </div>
          <label>
            <input
              checked={hstyle.enabled}
              type="checkbox"
              onChange={e => this.toggleHeaderEnabled(i)}
            />
            enabled
          </label>
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

  subTitle: {
    padding: '3px 5px',
    fontWeight: 'bold',
    fontSize: '.9em',
  },
})
