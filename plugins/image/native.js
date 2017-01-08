// @flow

import deepMerge from 'treed/deepMerge'
import NativeImageBody from './NativeImageBody'
import pluginBase from './'

export default deepMerge(pluginBase, {
  nodeTypes: {
    image: {render: NativeImageBody},
  },
})


