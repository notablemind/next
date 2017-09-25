import Component from './Presentation'
// import actions from './actions'
// import keys from './keys'
const actions = {}
const keys = {}

type NodeConfig = {
  type?: 'group' | 'persistant',
  style?: {
    position?: 'absolute' | 'relative',
    top?: number,
    left?: number,
    padding?: number | string,
    margin?: number | string,
    flexDirection: 'row' | 'column',
  },
  animateChildren?: 'swap' | 'reveal', // maybe add a "reveal w/ the first shown"?
  unRendered?: boolean, // or onlyRenderChildren?
}

export default {
  title: 'Presentation',
  // initialSharedViewData: () => ({expanded: {}}),
  // getInitialState: () => ({hideCompleted: false}), // maybe filters?
  // serializeState: state => state,
  Component,
  actions,
  keys,
  shortcut: 'p',
}

