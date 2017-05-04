// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

const makeBoolMap = (ids, obj) =>
  ids.reduce((o, i) => ((o[i] = !!obj[i]), o), {})

export default class PluginsPane extends Component {
  state: *
  constructor({treed, optionalPlugins}: any) {
    super()
    this.state = {
      enabledPlugins: makeBoolMap(
        optionalPlugins,
        treed.db.data.settings.plugins,
      ),
    }
  }

  isDirty() {
    for (let id of Object.keys(this.props.treed.config.plugins)) {
      if (
        !!this.state.enabledPlugins[id] !==
        !!this.props.treed.db.data.settings.plugins[id]
      ) {
        return true
      }
    }
  }

  commit = () => {
    const ids = Object.keys(this.state.enabledPlugins).filter(
      id => !!this.state.enabledPlugins[id],
    )
    this.props.onSetPlugins(ids)
    this.props.onClose()
  }

  render() {
    const {optionalPlugins, treed} = this.props
    return (
      <div>
        <div className={css(styles.title)}>
          Enabled plugins
        </div>
        {optionalPlugins.map(id => (
          <label
            key={id}
            className={css(
              styles.plugin,
              this.state.enabledPlugins[id] && styles.pluginSelected,
            )}
          >
            <input
              type="checkbox"
              checked={!!this.state.enabledPlugins[id]}
              onChange={e =>
                this.setState({
                  enabledPlugins: {
                    ...this.state.enabledPlugins,
                    [id]: e.target.checked,
                  },
                })}
            />
            <div className={css(styles.name)}>
              {treed.config.plugins[id].title || id}
            </div>
          </label>
        ))}
        {this.isDirty() &&
          <button onClick={this.commit}>
            Save
          </button>}
      </div>
    )
  }
}

const styles = StyleSheet.create({
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
