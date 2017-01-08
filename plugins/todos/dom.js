// @flow

import deepMerge from 'treed/deepMerge'

import TodoBody from './TodoBody'
import TodoSummary from './TodoSummary'

import pluginBase from './'

export default deepMerge(pluginBase, {
  nodeTypes: {
    todoSummary: {render: TodoSummary},
    todo: {render: TodoBody},
  },
})

