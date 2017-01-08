// @flow

import deepMerge from 'treed/deepMerge'
import ImageBody from './ImageBody'
import pluginBase from './'

export default deepMerge(pluginBase, {
  nodeTypes: {
    image: {render: ImageBody},
  },
})

