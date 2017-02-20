
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

const PLUGIN_ID = 'tags'

export default class Tags extends Component {
  state: *
  constructor({id, store}) {
    super()
    store.setupStateListener(
      this,
      store => [store.events.nodeView(id), store.events.settingsChanged(), store.events.mode()],
      store => ({
        node: store.getters.node(id),
        editState: store.getters.editState(id),
        pluginConfig: store.getters.pluginConfig(PLUGIN_ID),
        isTagging: store.getters.mode() === 'tagging' &&
          store.getters.active() === id,
      }),
    )
  }

  render() {
    const {node, pluginConfig, isTagging} = this.state
    const ids: Array<string> = (node.plugins[PLUGIN_ID]: any) || []
    if (!ids.length) return null
    const {tags} = pluginConfig
    return <div className={css(styles.tags)}>
      {ids.map(id => (
        <div
          key={id}
          style={{color: tags.color}}
          onClick={() => {}} // TODO
          className={css(styles.tag)}
        >
          {tags[id].label}
        </div>
      ))}
      {isTagging && <div>TAGGING</div>}
    </div>
  }
}

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    padding: '3px 5px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#eee',
    },
  },
})

