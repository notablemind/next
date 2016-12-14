
import canonicalKeyName from './canonicalKeyName'

export default (layer, shortcut, action) => {
  if (!shortcut.trim()) return // no shortcut
  shortcut.split(',').forEach(alt => {
    const steps = alt.trim().split(/\s+/g).map(canonicalKeyName)
    let prefix = ''
    for (let i=0; i<steps.length - 1; i++) {
      layer.prefixes[prefix + steps[i]] = true
      prefix = prefix + steps[i] + ' '
    }
    layer.actions[prefix + steps[steps.length - 1]] = action
  })
}

