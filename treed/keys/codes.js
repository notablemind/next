export const MODS = {
  91: 'meta',
  93: 'meta',
  18: 'alt',
  17: 'ctrl',
  16: 'shift',
}

export const KEYS = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  27: 'escape',
  32: 'space',
  33: 'page-up',
  34: 'page-down',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  46: 'delete',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9',
  58: '0',
  192: '`',
  189: '-',
  187: '=',
  113: 'f2',
  186: ';',
  134: 't', // †

  188: 'comma',
  190: '.',
  191: '/',
  220: '\\',
  222: "'",
  219: '[',
  221: ']',
}

export const KEY_NAMES = Object.keys(KEYS).map(key => KEYS[key])

export const SYNONYMS = {
  esc: 'escape',
  return: 'enter',
}

export const SHIFT_KEYS = {
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  plus: '=',
  '~': '`',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
}
