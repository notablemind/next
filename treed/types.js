// @flow

import {Component} from 'react'
import Database from './Database'
import type {Db, DumpedNode, Node, Settings} from './Database'

// TODO should I accomodate more types of contents?
// like an image, or something...
export type ClipboardContents = DumpedNode

export type MenuItem = {
  text: string,
  action?: () => any,
  checked?: bool,
  disabled?: bool,
  children?: Array<MenuItem>,
}

export type EditPos = 'start' | 'end' | 'default' | 'change'

export type Mode = 'normal' | 'insert' | 'visual'

export type PluginSummary = {
  node: {
    pasteFile: Array<Function>,
    pasteSpecial: Array<Function>,
    dropFileNew: Array<Function>,
    dropFileOnto: Array<Function>,
    contextMenu: Array<Function>,
  },
  nodeTypes: {
    [key: string]: PluginNodeTypeConfig<*>,
  },
}

export type GlobalState = {
  activeView: number,
  plugins: {},
  clipboard: ?ClipboardContents,
  runtimeId: string,
  documentId: string,
  cut: ?string,
}

export type StoreState = {
  root: string,
  active: string,
  activeIsJump: bool,
  mode: Mode,
  lastEdited: ?string,
  editPos: ?EditPos,
  viewType: string,
  selection: ?Array<string>,
  lastJumpOrigin: ?string,
  contextMenu: ?{
    pos: {left: number, top: number},
    menu: Array<MenuItem>,
  },
}

export type ViewTypeConfig = {
  Component: any,
  actions: ViewActionConfig,
  contextMenuVisual?: (store: Store) => ?MenuResult,
}

export type GlobalStore = {
  db: Database,
  actions: {[key: string]: Function},
  execute: (command: {
    type: string,
    args: any,
    preActive?: string,
    postActive?: string,
  }) => void,
  emit: (evt: string) => void,
  emitMany: (evts: Array<string>) => void,
  events: {[key: string]: (...args: any) => string},
  getters: {[key: string]: Function},
  globalState: GlobalState,
  plugins: PluginSummary,
  activeView: () => Store,
  addNormalKeyLayer: (layer: any) => () => void,
  on: (evts: Array<string>, fn: Function) => () => void,
  viewTypes: {[key: string]: ViewTypeConfig},
}

export type Store = GlobalStore & {
  id: number,
  state: StoreState,
}

// Keys!

export type UserShortcuts = {}

export type KeyLayerAction = {
  fn: Function,
  description: string,
  original: string,
}
export type KeyLayer = {
  prefixes: {[prefix: string]: true},
  actions: {
    [shortcut: string]: KeyLayerAction,
  },
}

export type KeyAction = {|
  shortcuts: {
    [mode: string]: string,
  },
  description: string,
  action: (store: Store, node: Node) => void,
|}

export type ViewKeyAction = KeyAction | {|
  shortcuts: {
    [mode: string]: string,
  },
  description: string,
  alias: string,
|}

export type ViewActionConfig = {
  [actionName: string]: ViewKeyAction,
}

// Plugins!

export type MenuResult = MenuItem | Array<MenuItem>

export type ColumnConfig = {
  editable?: bool,
  type?: string,
}

export type PluginNodeConfig = {|
  className?: (pluginData: any, node: Node, store: Store) => string,
  contextMenu?: (pluginData: any, node: Node, store: Store) => ?MenuResult,
  pasteSpecial?: (node: Node, store: Store, clipboard: any) => ?MenuResult,

  dropFileNew?: (store: Store, pid: string, idx: number, file: File) => bool,
  dropFileOnto?: (store: Store, id: string, file: File) => bool,
  pasteFile?: (store: Store, id: string, file: File, type: string, filename: string) => bool,
|}

export type PluginNodeTypeConfig<T> = {
  title: string,
  newSiblingsShouldCarryType?: bool,
  shortcut: string,
  render: ?any,
  defaultNodeConfig?: () => T,
  contextMenu?: (typeData: T, node: Node, store: Store) => ?MenuResult,
  pasteSpecial?: (typeData: T, clipboardData: any, node: Node, store: Store) => ?MenuResult,
  actions?: {
    [key: string]: KeyAction,
  },
  columns?: {
    [columnId: string]: ColumnConfig,
  },
}

export type Plugin<T, S> = {|
  id: string,
  node?: PluginNodeConfig,
  defaultGlobalConfig?: T,

  init?: (globalPluginConfig: T, globalStore: GlobalStore) => S,
  destroy?: (globalPluginState: S) => void,
  leftSidePane?: any,

  actionButtons?: {
    [key: string]: any,
  },

  nodeTypes?: {
    [key: string]: PluginNodeTypeConfig<*>,
  },

  view?: {
    [viewType: string]: {
      className?: (store: Store) => string,
    },
  },
|}

