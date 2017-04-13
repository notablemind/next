// @flow

import React from 'react';
import CodeBlock from './CodeBlock'
import Manager from './Manager'
import Settings from './Settings'

const sources = [
  require('./sources/browser').default,
]

const PLUGIN_ID = 'code'

const plugin: Plugin<*, *> = {
  id: PLUGIN_ID,
  title: 'Code',

  defaultGlobalConfig: { sources: {}, kernels: {} },

  init(globalPluginConfig, globalStore) {
    const manager = new Manager(globalStore.globalState.documentId, globalPluginConfig, globalStore, sources)
    window.manager = manager
    return manager.init().then(() => manager)
  },

  settingsPage(globalPluginConfig, pluginState, store) {
    return <Settings
      config={globalPluginConfig}
      manager={pluginState}
      sources={sources}
      store={store}
    />
  },

  actions: {
    setNodeKernel(store, id, kernelId, language) {
      store.actions.updateNested(id, ['types', 'code'], {kernelId, language})
    },

    executeNode(store, id) {
      const manager = store.getters.pluginState('code')
      manager.execute(id)
    },
  },

  nodeTypes: {
    code: {
      title: 'Code',
      newSiblingsShouldCarryType: true,
      shortcut: 'c',

      render: CodeBlock,

      defaultNodeConfig(fromNode) {
        if (fromNode) {
          return {
            ...fromNode.types.code,
            lastRun: null,
            dirty: false,
          }
        }
        return {
          lastRun: null,
          dirty: false,
          kernelId: null,
          language: 'javascript', // TODO have a better way of defining that
        }
      },

      actions: {
        execute: {
          shortcuts: {
            normal: 'cmd+enter',
            visual: 'cmd+enter',
            insert: 'cmd+enter',
          },
          description: 'Execute',
          action(store) {
            const manager = store.getters.pluginState('code')
            manager.execute(store.state.active)
            console.log('want to execute yall')
          },
        },
      },
    },
  },
}

export default plugin
