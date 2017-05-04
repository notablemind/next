type Style = {
  backgroundColor?: ?string,
  color?: ?string,
  fontSize?: ?number, // em
  fontFamily?: ?string, // will have dropdown box for this
  fontWeight?: ?number, // or normal|bold|lighter|bolder?
  lineHeight?: ?number,
  italic?: boolean,
  // padding: maybe
}

type ThemeSettings = {
  indentType: 'dots' | 'lines',
  headerStyles: Array<{
    style: Style,
    level: number,
    enabled: boolean,
  }>,
  // TODO maybe enable styling of node types?
  individualStyles: {
    [key: string]: {
      enabled: boolean,
      style: Style,
    },
  },
}

const themeToCss = (settings: ThemeSettings): string => {
  return settings.headerStyles
    .map(style => {
      if (!style.enabled) return ''
      const levelName = `.Node_body_level_${style.level}`
      const body = Object.keys(style.style)
        .map(name => {
          if (name === 'italic') {
            if (style.style[name]) {
              return 'font-style: italic!important;'
            } else {
              return ''
            }
          }
          const kebab = name.replace(/[A-Z]/g, n => '-' + n.toLowerCase())
          const needsEm = name === 'fontSize'
          return `${kebab}: ${style.style[name]}${needsEm ? 'em' : ''}!important;`
        })
        .join('\n')
      // TODO maybe exclude some for the input one? Maybe not though too.
      return `
${levelName} > .Node_rendered {
${body}
}
${levelName} > .Node_input {
${body}
}
`
    })
    .join('\n')
}

export const defaultThemeSettings: ThemeSettings = {
  indentType: 'lines',
  headerStyles: [
    {
      style: {
        fontSize: 1.5,
        fontWeight: 'normal',
        italic: true,
      },
      level: 0,
      enabled: true,
    },
    {
      style: {
        fontSize: 1.3,
        fontWeight: 'normal',
        color: '#5385ff',
      },
      level: 1,
      enabled: true,
    },
    {
      style: {
        fontSize: 1.1,
        fontWeight: 'normal',
        italic: true,
      },
      level: 2,
      enabled: true,
    },
  ],
}

export default class ThemeManager {
  settings: ThemeSettings
  constructor(settings: ThemeSettings) {
    this.settings = settings
    this.node = document.createElement('style')
    document.head.appendChild(this.node)
    this.sync()
  }

  destroy() {
    this.node.parentNode.removeChild(this.node)
  }

  update(settings: ThemeSettings) {
    this.settings = settings
    this.sync()
  }

  sync() {
    this.node.textContent = themeToCss(this.settings)
  }
}
