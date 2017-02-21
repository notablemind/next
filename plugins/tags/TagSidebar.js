// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

const PLUGIN_ID = 'tags'

export default class TagSidebar extends Component {
  _sub: any
  state: *

  constructor({store}: any) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.settingsChanged(),
        store.events.node(store.getters.active()),
        store.events.activeNode(),
      ],
      store => ({
        id: store.getters.active(),
        ids: store.getters.nodePluginData(store.getters.active(), PLUGIN_ID) || [],
        tags: store.getters.pluginConfig(PLUGIN_ID).tags,
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

  toggleTag = (id: string, selected: boolean) => {
    const {store} = this.props
    if (selected) {
      store.actions.addTag(id)
    } else {
      store.actions.removeTag(id)
    }
  }

  // TODO change labels, change colors, delete tags
  render() {
    const {tags, ids, id} = this.state
    return <div className={css(styles.container)}>
      <div className={css(styles.title)}>
        Tags
      </div>
      <div className={css(styles.tags)}>
        {Object.keys(tags).map(id => {
          const selected = ids.indexOf(id) !== -1
          return <div key={id}
            className={css(styles.tag, selected && styles.selected)}
            onClick={() => this.toggleTag(id, !selected)}
            style={{backgroundColor: tags[id].color}}
          >
            <input
              checked={selected}
              type="checkbox"
              onChange={e => this.toggleTag(id, e.target.checked)}
            />
            <div className={css(styles.label)}>
              {tags[id].label}
            </div>
          </div>
        })}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  title: {
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: 400,
    alignItems: 'center',
    borderTop: '1px solid #ccc',
    paddingTop: 10,
    marginTop: 10,
  },

  tags: {
  },

  tag: {
    padding: '3px 5px',
    fontSize: 10,
    flexDirection: 'row',
    alignItems: 'center',
    margin: 3,
    borderRadius: 3,
    cursor: 'pointer',
  },

  label: {
    marginLeft: 3,
  },

  selected: {
    // backgroundColor: '#aaf',
  },
})
