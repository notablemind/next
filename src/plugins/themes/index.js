
import React from 'react'
import './themes.less'

import SidePane from './SidePane'

type Style = {
  backgroundColor?: ?string,
  color?: ?string,
  fontSize?: ?number, // em
  fontFamily?: ?string, // will have dropdown box for this
  fontWeight?: ?number, // or normal|bold|lighter|bolder?
  lineHeight?: ?number,
  italic?: bool,
  // padding: maybe
}

type ThemeSettings = {
  indentType: 'dots' | 'lines',
  headerStyles: Array<{
    style: Style,
    level: number,
    enabled: bool,
  }>,
  // TODO maybe enable styling of node types?
  individualStyles: {
    [key: string]: Style,
  },
}

const header1 = {
  fontSize: 1.5,
  fontWeight: 'normal',
  italic: true,
}

const header2 = {
  fontSize: 1.3,
  fontWeight: 'normal',
  color: '#5385ff',
}

const header3 = {
  fontSize: 1.1,
  fontWeight: 'normal',
  italic: true,
}

export const defaultGlobalConfig: ThemeSettings = {
  indentType: 'lines',
  headerStyles: [{
    style: header1,
    level: 0,
    enabled: true,
  }, {
    style: header2,
    level: 1,
    enabled: true,
  }, {
    style: header3,
    level: 2,
    enabled: true,
  }],

  individualStyles: {
    highlighted: {
      name: 'highlighted',
      shortcut: 'h',
      style: {
        backgroundColor: '#ffff79',
      },
    },
    pink: {
      name: 'pink',
      shortcut: 'p',
      style: {
        backgroundColor: '#ffe9f5',
      },
    },
    disabled: {
      name: 'disabled',
      shortcut: 'd',
      style: {
        color: '#aaa',
        italic: true,
      },
    },
    bold: {
      name: 'bold',
      shortcut: 'b',
      style: {
        fontWeight: 'bold',
      },
    },
    italic: {
      name: 'italic',
      shortcut: 'i',
      style: {
        italic: true,
      },
    },
    header1: {
      name: 'header1',
      style: header1,
      shortcut: '1',
    },
    header2: {
      name: 'header2',
      style: header2,
      shortcut: '2',
    },
    header3: {
      name: 'header3',
      style: header3,
      shortcut: '3',
    },
  },
}




const kebab = name => name.replace(/[A-Z]/g, n => '-' + n.toLowerCase())

const styleClassName = key => `Notablemind_individual_style_${key}`

const makeClassNames = enabledStyles => Object.keys(enabledStyles)
  .filter(key => enabledStyles[key])
  .map(styleClassName)
  .join(' ')

const styleAttr = (name, val) => {
  if (name === 'italic') {
    if (val) {
      return 'font-style: italic!important;'
    } else {
      return ''
    }
  }
  const needsEm = name === 'fontSize'
  return `${kebab(name)}: ${val}${needsEm ? 'em' : ''}!important;`
}

const styleToRuleBody = style => {
  const text = []
  const container = []
  Object.keys(style).forEach(name => {
    const attr = styleAttr(name, style[name])
    text.push(attr)
    /*
    // TODO maybe this is the thing to do...
    if (name === 'backgroundColor') container.push(attr)
    else text.push(attr)
    */
  })
  return {text: text.join('\n'), container: container.join('\n')}
}

const styleToRules = (className, style) => {
  const {text, container} = styleToRuleBody(style)
  return `
${className} {
${container}
}
${className} > .Node_rendered {
${text}
}

${className} > .Node_input {
${text}
}
`
}

const themeToCss = (settings: ThemeSettings): string => {
  return settings.headerStyles.map(
    style => style.enabled ?
      styleToRules(`.Node_body_level_${style.level}`, style.style) :
      ''
  ).join('\n') +
  Object.keys(settings.individualStyles).map(
    key => styleToRules('.' + styleClassName(key), settings.individualStyles[key].style)
  ).join('\n')
}

// global plugin config -> saved on the document
// global plugin state -> transient state (default null)
// plugin data -> `node.plugins[pluginId]`

const PLUGIN_ID = 'themes'

export default {
  id: PLUGIN_ID,
  defaultGlobalConfig,
  // defaultNodeData: null,

  // (globalPluginConfig) -> globalPluginState
  // TODO I want a "plugin store" or sth, not "treed"
  init(globalPluginConfig, treed) {
    const styleNode = document.createElement('style')
    document.head.appendChild(styleNode)
    styleNode.textContent = themeToCss(globalPluginConfig)
    return {
      styleNode,
      preview(config) {
        styleNode.textContent = themeToCss(config)
      },
      unsub: treed.on([treed.config.events.settingsChanged()], () => {
        // TODO first check if it changed?
        styleNode.textContent = themeToCss(
          treed.db.data.settings.plugins[PLUGIN_ID]
        )
      })
    }
  },

  // globalPluginState -> void
  destroy(globalPluginState) {
    const {styleNode} = globalPluginState
    styleNode.parentNode.removeChild(styleNode)
    globalPluginState.unsub()
  },

  leftSidePane: SidePane,

  node: {
    className: (pluginData, node, store) =>
      pluginData && makeClassNames(pluginData),

    contextMenu(pluginData, node, store) {
      return Object.keys(store.getters.pluginConfig(PLUGIN_ID).individualStyles).map(name => ({
        name,
        checked: pluginData && pluginData[name],
        action: () => store.actions.setPluginData(node._id, PLUGIN_ID, {
          ...pluginData,
          [name]: !(pluginData && pluginData[name])
        }),
      }))
    },
  },

  view: {
    list: {
      className(store) {
        if (store.getters.pluginConfig(PLUGIN_ID).indentType === 'dots') {
          return 'Themefeature_indent--bullets'
        }
        return ''
      }
    },
  },

  // globalContextMenu?

}

