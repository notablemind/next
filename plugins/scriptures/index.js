
import ScripturePane from './ScripturePane'
import ScriptureReference from './ScriptureReference'

const PLUGIN_ID = 'scriptures'

export default {
  id: PLUGIN_ID,
  defaultGlobalConfig: {
  },
  rightSidePane: ScripturePane,
  serializeState: state => state,
  getInitialState: () => null,

  nodeTypes: {
    scriptureReference: {
      title: 'Scripture Reference',
      newSiblingsShouldCarryType: false,
      creatable: false,

      render: ScriptureReference,
    },
  },
}
