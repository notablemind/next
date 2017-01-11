
import pluginData from './'
import DateNode from './DateNode'
import deepMerge from 'treed/deepMerge'

export default deepMerge(pluginData, {
  nodeTypes: {
    date: { render: DateNode },
  },
})

