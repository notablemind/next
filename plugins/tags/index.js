// @flow

import React, {Component} from 'react';
import type {Plugin, Store} from 'treed/types'
import uuid from 'treed/uuid'
import colors from './colors'

import TagSidebar from './TagSidebar'
import Tags from './Tags'

const PLUGIN_ID = 'tags'

type Tag = {
  id: string,
  label: string,
  color: string,
}

type GlobalConfig = {
  tags: {[tagId: string]: Tag}
}

// const COLORS = ['#aaf', '#faf', '#faa']

const randomColor = () => {
  return colors[parseInt(Math.random() * colors.length)]
}

const plugin: Plugin<*, *> = {
  id: PLUGIN_ID,

  defaultGlobalConfig: {
    tags: {},
  },

  init(globalPluginConfig, globalStore) {
    return {
      // unsub: globalStore.on([globalStore.events.settingsChanged()]
    }
  },

  leftSidePane: TagSidebar,

  actions: {
    addTag(store: Store, tagId: string, id: string = store.state.active) {
      const node = store.getters.activeNode()
      const tags = node.plugins[PLUGIN_ID] || []
      if (tags.indexOf(tagId) !== -1) return
      store.actions.setPluginData(node._id, PLUGIN_ID, tags.concat([tagId]))
      store.emit(store.events.node(id))
    },

    createTag(store: Store, tagText: string, id: string = store.state.active) {
      const config = store.getters.pluginConfig(PLUGIN_ID)
      const node = store.getters.activeNode()
      const nodeTags = node.plugins[PLUGIN_ID] || []
      const tid = uuid()
      store.actions.setGlobalPluginConfig(PLUGIN_ID, {
        ...config,
        tags: {
          ...config.tags,
          [tid]: {
            id: tid,
            label: tagText,
            color: randomColor(),
          },
        },
      });
      store.actions.setPluginData(node._id, PLUGIN_ID, nodeTags.concat([tid]))
      store.emitMany([store.events.node(id), store.events.settingsChanged()])
    },

    removeTag(store: Store, tagId: string, id: string = store.state.active) {
      const node = store.getters.activeNode()
      const tags = node.plugins[PLUGIN_ID] || []
      if (tags.indexOf(tagId) === -1) return
      store.actions.setPluginData(node._id, PLUGIN_ID, tags.filter(id => id !== tagId))
      store.emit(store.events.node(id))
    },

    editTags(store: Store) {
      store.actions.setMode('tagging')
    },
  },

  keys: {
    editTags: {
      shortcuts: {
        normal: '#',
        insert: 'cmd+3',
      },
      description: 'Edit the tags',
      alias: 'editTags',
    },
  },

  node: {
    blocks: {
      after: (key, node, store) => <Tags key={key} id={node._id} store={store} />,
    },
  },
}

export default plugin
