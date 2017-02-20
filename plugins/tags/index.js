// @flow

import React, {Component} from 'react';
import type {Plugin, Store} from 'treed/types'
import uuid from 'treed/uuid'

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

const COLORS = ['#aaf', '#faf', '#faa']

const randomColor = () => {
  return COLORS[parseInt(Math.random() * COLORS.length)]
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

  actions: {
    addTag(store: Store, tagId: string) {
      const node = store.getters.activeNode()
      const tags = node.plugins[PLUGIN_ID] || []
      if (tags.indexOf(tagId) !== -1) return
      store.actions.setPluginData(node._id, PLUGIN_ID, tags.concat([tagId]))
    },

    createTag(store: Store, tagText: string) {
      const config = store.getters.pluginConfig(PLUGIN_ID)
      const node = store.getters.activeNode()
      const nodeTags = node.plugins[PLUGIN_ID] || []
      const tid = uuid()
      store.actions.setGlobalPluginConfig({
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
    },

    removeTag(store: Store, tagId: string) {
      const node = store.getters.activeNode()
      const tags = node.plugins[PLUGIN_ID] || []
      if (tags.indexOf(tagId) === -1) return
      store.actions.setPluginData(node._id, PLUGIN_ID, tags.filter(id => id !== tagId))
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
