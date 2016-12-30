// @-flow

import canonicalEventName from './canonicalEventName'
import {MODS} from './codes'

type Layer = {
  prefixes: {[key: string]: true},
  actions: {[key: string]: () => void},
}

export default class KeyManager {
  constructor(layers=[]) {
    this.layers = layers
    this.numLayers = 0
    this.prefix = ''
    this.prefixListeners = []
  }

  addLayer = (layer) => {
    this.layers.push(layer)
    return () => this.removeLayer(layer)
  }

  removeLayer = (layer) => {
    this.layers = this.layers.filter(l => l !== layer)
  }

  addPrefixListener(fn: Function) {
    this.prefixListeners.push(fn)
    return () => this.prefixListeners.splice(this.prefixListeners.indexOf(fn), 1)
  }

  makeCompletionsList(firstLayer, i) {
    const completions = []
    for (let name in firstLayer.actions) {
      if (name.indexOf(this.prefix) === 0) {
        completions.push(name)
      }
    }
    this.layers.slice(i + 1).forEach(l => {
      const layer = typeof l === 'function' ? l() : l
      if (!layer) return
      for (let name in layer.actions) {
        if (name.indexOf(this.prefix) === 0) {
          completions.push(name)
        }
      }
    })
    return completions
  }

  clearPrefix() {
    this.prefix = ''
    if (this.prefixListeners.length) {
      this.prefixListeners.forEach(fn => fn('', []))
    }
  }

  handle = (e) => {
    if (MODS[e.keyCode]) {
      // just ignore modifiers
      return
    }
    const key = canonicalEventName(e)
    const full = this.prefix + key
    const handled = this.layers.some((l, i) => {
      const layer = typeof l == 'function' ? l() : l
      if (!layer) return
      if (layer.prefixes[full]) {
        this.prefix = full + ' '
        if (this.prefixListeners.length) {
          const completions = this.makeCompletionsList(layer, i)
          this.prefixListeners.forEach(fn => fn(this.prefix, completions))
        }
        return true
      }
      if (layer.actions[full]) {
        // TODO do I need to only conditionally stop propagation n stuff?
        // if I'm gonna be capturing cmd+v then yes.
        layer.actions[full]()
        this.clearPrefix()
        return true
      }
    })
    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    } else {
      this.clearPrefix()
    }
  }
}

