
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
  if (!style) return ''
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

export default themeToCss

