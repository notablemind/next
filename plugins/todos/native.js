
import deepMerge from 'treed/deepMerge'
import NativeTodoBody from './NativeTodoBody'
// import NativeTodoSummary from './NativeTodoSummary'

import pluginBase from './'

export default deepMerge(pluginBase, {
  nodeTypes: {
    // todoSummary: {render: NativeTodoSummary},
    todo: {render: NativeTodoBody},
  },
})


