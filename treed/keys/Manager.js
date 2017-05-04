// @flow

import canonicalEventName from './canonicalEventName'
import {MODS} from './codes'

import type {KeyLayer} from '../types'

window.DEBUG_KEYS = false

type Layer = KeyLayer | (() => ?KeyLayer)

export default class KeyManager {
  prefix: string
  layers: Array<Layer>
  prefixListeners: Array<Function>

  constructor(layers: Array<Layer> = []) {
    this.layers = layers
    this.prefix = ''
    this.prefixListeners = []
  }

  addLayer = (layer: Layer) => {
    this.layers.push(layer)
    return () => this.removeLayer(layer)
  }

  removeLayer = (layer: Layer) => {
    this.layers = this.layers.filter(l => l !== layer)
  }

  addPrefixListener(fn: Function) {
    this.prefixListeners.push(fn)
    return () =>
      this.prefixListeners.splice(this.prefixListeners.indexOf(fn), 1)
  }

  makeCompletionsList(firstLayer: KeyLayer, i: number) {
    const completions = []
    for (let name in firstLayer.actions) {
      if (name.indexOf(this.prefix) === 0) {
        completions.push(firstLayer.actions[name])
      }
    }
    this.layers.slice(i + 1).forEach(l => {
      const layer = typeof l === 'function' ? l() : l
      if (!layer) return
      for (let name in layer.actions) {
        if (name.indexOf(this.prefix) === 0) {
          completions.push(layer.actions[name])
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

  handle = (e: any) => {
    if (MODS[e.keyCode]) {
      // just ignore modifiers
      return
    }
    const key = canonicalEventName(e)
    if (!key) return
    const full = this.prefix + key
    if (window.DEBUG_KEYS) {
      console.log('key:', full)
    }
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
        const res = layer.actions[full].fn()
        if (layer.actions[full].fallback && res === false) {
          layer.actions[full].fallback.fn()
        }
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
