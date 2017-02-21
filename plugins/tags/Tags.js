
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import TagInput from './TagInput'

const PLUGIN_ID = 'tags'

export default class Tags extends Component {
  state: *
  _sub: *
  constructor({id, store}) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => [
        store.events.node(id),
        store.events.nodeView(id),
        store.events.settingsChanged(),
        store.events.mode()],
      store => ({
        node: store.getters.node(id),
        pluginConfig: store.getters.pluginConfig(PLUGIN_ID),
        isTagging: store.getters.mode() === 'tagging' &&
          store.getters.active() === id,
      }),
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    const {node, pluginConfig, isTagging} = this.state
    const {store} = this.props
    const {tags} = pluginConfig
    const ids: Array<string> = ((node.plugins[PLUGIN_ID]: any) || []).filter(id => tags[id])
    if (!ids.length && !isTagging) return null
    return <div className={css(styles.tags)} onMouseDown={e => e.stopPropagation()}>
      {ids.map(id => (
        <div
          key={id}
          style={{backgroundColor: tags[id].color}}
          onClick={() => {}} // TODO
          className={css(styles.tag)}
        >
          {tags[id].label}
        </div>
      ))}
      {isTagging && <TagInput
        tags={Object.keys(tags).map(id => tags[id])}
        onNormalMode={() => store.actions.normalMode()}
        onCreateTag={label => store.actions.createTag(label)}
        onAddTag={tag => store.actions.addTag(tag.id)}
        ids={ids}
      />}
    </div>
  }
}

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 3,
  },

  tag: {
    padding: '2px 5px',
    margin: 1,
    borderRadius: 2,
    fontSize: 10,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#eee',
    },
  },
})

