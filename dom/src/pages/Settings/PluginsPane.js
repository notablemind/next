// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

const makeBoolMap = ids => ids.reduce((o, i) => (o[i] = true, o), {})

export default class PluginsPane extends Component {
  state: *
  constructor({treed}: any) {
    super()
    /*
    store.setupStateListener(
      this,
      store => [store.settingsChanged()],
      store => ({settings: store.db.data.settings}),
    )
    */
    this.state = {
      enabledPlugins: makeBoolMap(Object.keys(treed.db.data.settings.plugins)),
    }
  }

  isDirty() {
    for (let id of Object.keys(this.props.treed.config.plugins)) {
      if (!!this.state.enabledPlugins[id] !== !!this.props.treed.db.data.settings.plugins[id]) {
        return true
      }
    }
  }

  commit = () => {
    const ids = Object.keys(this.state.enabledPlugins).filter(id => !!this.state.enabledPlugins[id])
    this.props.onSetPlugins(ids)
    this.props.onClose()
  }

  render() {
    const {treed} = this.props
    return <div>
      <div
        className={css(styles.title)}
      >
        Enabled plugins
      </div>
      {Object.keys(treed.config.plugins).map(id => (
        <label
          key={id}
          className={css(styles.plugin, this.state.enabledPlugins[id] && styles.pluginSelected)}
        >
          <input
            type="checkbox"
            checked={!!this.state.enabledPlugins[id]}
            onChange={e => this.setState({enabledPlugins: {...this.state.enabledPlugins, [id]: e.target.checked}})}
          />
          <div className={css(styles.name)}>
          {treed.config.plugins[id].title || id}
          </div>
        </label>
      ))}
      {this.isDirty() &&
        <button
          onClick={this.commit}
        >
          Save
        </button>}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
  },

  plugin: {
    padding: 5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  pluginSelected: {
    backgroundColor: '#eef',
  },

  name: {
    padding: '5px 10px',
  },

  title: {
    fontSize: 20,
  },
})
