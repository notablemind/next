// @flow

import CodeBlock from './CodeBlock'

const sources = [
  require('./sources/browser').default,
]

const PLUGIN_ID = 'code'

const plugin: Plugin<*, *> = {
  id: PLUGIN_ID,

  defaultGlobalConfig: { sources: {}, kernels: {} },

  init(globalPluginConfig, globalStore) {
    const manager = new Manager(globalPluginConfig, globalStore)
    return manager.init().then(() => manager)
  },

  nodeTypes: {
    code: {
      title: 'Code',
      newSiblingsShouldCarryType: true,
      shortcut: 'c',

      render: CodeBlock,

      defaultNodeConfig() {
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
            const node = store.getters.activeNode()
            console.log('want to execute yall')
          },
        },
      },
    },
  },
}

export default plugin
