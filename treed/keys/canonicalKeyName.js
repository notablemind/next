
import {SYNONYMS, SHIFT_KEYS} from './codes'

export default (step: string) => {
  if (!step.trim()) return
  const parts = step.split('+')
  const mods = {}
  // TODO handle people putting `meta` instead of `cmd`
  // also maybe allow ppl to swap btw cmd + ctrl for mac vs other?
  parts.slice(0, -1).forEach(mod => mods[mod.toLowerCase()] = true)
  let last = parts[parts.length - 1]
  if (!last) {
    console.warn(`you probably used a + when you should have plus: "${step}"`)
    return
  }

  if (SYNONYMS[last]) {
    last = SYNONYMS[last]
  }
  if (last.toLowerCase() !== last) {
    if (mods.shift) console.warn(`${last} is already shifted`)
    mods.shift = true
    last = last.toLowerCase()
  }
  if (SHIFT_KEYS[last]) {
    if (mods.shift) console.warn(`${last} is already shifted`)
    mods.shift = true
    last = SHIFT_KEYS[last]
  }

  let name = ''
  // alphabetical
  if (mods.alt) name += 'alt+'
  if (mods.cmd) name += 'cmd+'
  if (mods.ctrl) name += 'ctrl+'
  if (mods.shift) name += 'shift+'
  return name + last
}

