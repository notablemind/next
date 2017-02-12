// @flow

import canonicalKeyName from './canonicalKeyName'
import type {KeyLayer} from '../types'


export default (layer: KeyLayer, shortcut: string, action: Function, description: string, fallback: boolean = false) => {
  if (!shortcut.trim()) return // no shortcut
  shortcut.split(',').forEach(alt => {
    const steps = alt.trim().split(/\s+/g).map(canonicalKeyName)
    let prefix = ''
    for (let i=0; i<steps.length - 1; i++) {
      layer.prefixes[prefix + steps[i]] = true
      prefix = prefix + steps[i] + ' '
    }
    const key = prefix + steps[steps.length - 1]
    if (layer.actions[key] && !fallback) {
      console.warn('overriding key shortcut', key)
    }
    layer.actions[key] = {
      fn: action,
      description,
      original: shortcut,
      fallback: fallback ? layer.actions[key] : null,
    }
  })
}

