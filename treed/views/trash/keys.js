// @flow

import type {ViewActionConfig} from '../../types'

const keys: ViewActionConfig = {
  up: {
    shortcuts: {
      normal: 'k, up',
    },
    description: '',
    alias: 'focusUp',
  },

  down: {
    shortcuts: {
      normal: 'j, down',
    },
    description: '',
    alias: 'focusDown',
  },
}

export default keys
