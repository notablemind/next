import {KEY_NAMES, SHIFT_KEYS, SYNONYMS, KEYS} from './codes'

const letters = 'abcdefghijklmnopqrstuvwxyz'

const handleVariants = single => {
  const moded = single.split('+')
  let last = moded.pop()
  if (SHIFT_KEYS[last]) {
    moded.push('shift')
    last = SHIFT_KEYS[last]
  } else if (SYNONYMS[last]) {
    last = SYNONYMS[last]
  } else if (
    last.toLowerCase() !== last &&
    letters.indexOf(last.toLowerCase()) !== -1
  ) {
    moded.push('shift')
    last = last.toLowerCase()
  } else if (KEY_NAMES.indexOf(last) === -1 && letters.indexOf(last) === -1) {
    console.log('failed to load key: ' + last)
  }
  return moded.concat([last]).join('+')
}

function keyName(code) {
  if (code <= 90 && code >= 65) {
    return String.fromCharCode(code + 32)
  }
  if (code >= 48 && code <= 57) {
    return String.fromCharCode(code)
  }
  return KEYS[code]
}

export default function modKeyName(e) {
  var key = keyName(e.keyCode)
  if (!key) {
    if (window.DEBUG_KEYS) {
      console.log('unknown key', e.keyCode)
    }
    return null
  }
  // ORDER OF MODIFIERS:
  if (e.altKey) key = 'alt+' + key
  if (e.shiftKey) key = 'shift+' + key
  if (e.ctrlKey) key = 'ctrl+' + key
  if (e.metaKey) key = 'cmd+' + key
  return key
}
