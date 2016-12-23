
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
  }

  addLayer(layer) {
    this.layers.push(layer)
    return () => this.removeLayer(layer)
  }
  removeLayer(layer) {
    this.layers = this.layers.filter(l => l !== layer)
  }

  handle(e) {
    if (MODS[e.keyCode]) {
      // just ignore modifiers
      return
    }
    const key = canonicalEventName(e)
    const full = this.prefix + key
    const handled = this.layers.some(l => {
      const layer = typeof l == 'function' ? l() : l
      if (!layer) return
      if (layer.prefixes[full]) {
        this.prefix = full + ' '
        return true
      }
      if (layer.actions[full]) {
        // TODO do I need to only conditionally stop propagation n stuff?
        layer.actions[full]()
        this.prefix = ''
        return true
      }
    })
    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    } else {
      this.prefix = ''
    }
  }
}

