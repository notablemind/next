
const kebab = name => name.replace(/[A-Z]/g, n => '-' + n.toLowerCase())

const styleClassName = key => `Notablemind_individual_style_${key}`

export const makeClassNames = enabledStyles => Object.keys(enabledStyles)
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
  const needsEm = name === 'fontSize' && typeof val === 'number'
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

const styleToSimpleRule = (className, style) => {
  if (!style) return ''
  if (!Object.keys(style).length) return ''
  const {text, container} = styleToRuleBody(style)
  return `
${className} {
${container}
${text}
}
`
}

const styleToRules = (className, style) => {
  if (!style) return ''
  if (!Object.keys(style).length) return ''
  const {text, container} = styleToRuleBody(style)
  return `
${className} {
${container}
}
${className} .Node_rendered {
${text}
}

${className} .Node_input {
${text}
}
`
}

import type {Theme} from './themes'
import type {GlobalConfig} from './defaultGlobalConfig'

type Themes = {
  [themeId: string]: Theme,
}

const headerStylesToCss = headerStyles => {
  return headerStyles.map((style, i) => styleToRules(`.Node_body.Header.Header-${i}`, style)).join('\n')
}

const individualStylesToCss = (overrides, base) => {
  const allKeys = Object.keys(overrides).concat(Object.keys(base).filter(k => undefined === overrides[k]))
  return allKeys.map(
    key => styleToRules('.' + styleClassName(key), (overrides[key] || base[key]).style)
  ).join('\n')
}

const baseHeaderStyleToCss = (override, base) => {
  const style = {...base, ...override}
  return styleToRules(`.Node_body.Header`, style)
}

const baseStyleToCss = (override, base) => {
  const style = {...base, ...override}
  let fontSizeWrapper = ''
  if (style.fontSize) {
    fontSizeWrapper = `\n.Node_root { font-size: ${style.fontSize} }\n`
    delete style.fontSize
  }
  return styleToRules(`.Node_body`, style) + fontSizeWrapper
}

const globalStylesToCss = (override={}, base={}) => {
  return [
    baseStyleToCss(override.text, base.text),
    styleToRules('.Node_body.Header', {...base.header, ...override.header}),
    styleToSimpleRule('.Node_rendered p code', {...base.inlineCode, ...override.inlineCode}),
    styleToSimpleRule('.Node_rendered pre code', {...base.code, ...override.code}),
    styleToSimpleRule('.Node_rendered p a', {...base.link, ...override.link}),
  ].join('\n\n')
}

const themeToCss = ({theme, overrides={}}: GlobalConfig, themes: Themes): string => {
  const themeStyle = themes[theme || 'default']
  console.log('global', overrides.global, themeStyle.global)
  console.log('theme to css', themeStyle, overrides)
  return headerStylesToCss(overrides.headerStyles || themeStyle.headerStyles) +
  individualStylesToCss(overrides.individualStyles || {}, themeStyle.individualStyles) +
  '\n\n' + globalStylesToCss(overrides.global || {}, themeStyle.global)
}

export default themeToCss

