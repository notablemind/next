// @flow

import {KEYS} from './codes'

const a = 'A'.charCodeAt(0)
const z = 'Z'.charCodeAt(0)
const zero = '0'.charCodeAt(0)
const nine = '9'.charCodeAt(0)

export default (event: any) => {
  let name = ''
  // alphabetical order
  if (event.altKey) name += 'alt+'
  if (event.metaKey) name += 'cmd+'
  if (event.ctrlKey) name += 'ctrl+'
  if (event.shiftKey) name += 'shift+'
  if (
    (a <= event.keyCode && event.keyCode <= z) ||
    (zero <= event.keyCode && event.keyCode <= nine)
  ) {
    name += String.fromCharCode(event.keyCode).toLowerCase()
  } else if (KEYS[event.keyCode]) {
    name += KEYS[event.keyCode]
  } else {
    console.error('Unknown key code: ' + event.keyCode, event)
    return null
  }
  return name
}

