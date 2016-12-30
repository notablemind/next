// @flow

export type Node = any

// TODO should I accomodate more types of contents?
// like an image, or something...
export type ClipboardContents = DumpedNode

export type MenuItem = {
  text: string,
  action?: () => void,
  checked?: bool,
  disabled?: bool,
  children?: Array<MenuItem>,
}

export type EditPos = 'start' | 'end' | 'default' | 'change'

export type Mode = 'normal' | 'insert' | 'visual'

export type Db<D> = {
  data: {[key: string]: D},
  save: (doc: any) => Promise<void>,
  saveMany: (docs: Array<any>) => Promise<void>,
  update: (id: string, doc: any) => Promise<void>,
  upsert: (id: string, fn: (doc: any) => any) => Promise<void>,
  set: (id: string, attr: string, value: any) => Promise<void>,
  setNested: (id: string, attrs: Array<string>, value: any) => Promise<void>,
  delete: (doc: any) => Promise<void>,
  getAttachment: (id: string) => Promise<any>,
  cloneTree: (id: string) => DumpedNode,
}

export type DumpedNode = Node & {
  children: [DumpedNode],
}

export type PluginSummary = {
  node: {
    pasteFile: Array<Function>,
    dropFileNew: Array<Function>,
    dropFileOnto: Array<Function>,
    contextMenu: Array<Function>,
  },
  nodeTypes: {
    [key: string]: {
      defaultNodeConfig?: () => any,
    },
  },
}

export type GlobalState = {
  activeView: string,
  plugins: {},
  clipboard: ?ClipboardContents,
  runtimeId: string,
  documentId: string,
  cut: ?string,
}

export type StoreState = {
  root: string,
  active: string,
  mode: Mode,
  lastEdited: string,
  editPos: EditPos,
  viewType: string,
  selection: ?Array<string>,
  lastJumpOrigin: ?string,
  contextMenu: ?{
    pos: {left: number, top: number},
    menu: Array<MenuItem>,
  },
}

export type GlobalStore = {
  db: Db<Node>,
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
}

export type Store = GlobalStore & {
  id: string,
  state: StoreState,
}


// Plugins!

export type PluginNodeConfig = {
  dropFileNew?: (store: Store, pid: string, idx: number, file: File) => bool,
  dropFileOnto: (store: Store, id: string, file: File) => bool,
  pasteFile?: (store: Store, id: string, file: File, type: string, filename: string) => bool,
}

export type MenuResult = MenuItem | Array<MenuItem>

export type PluginNodeTypeConfig<T> = {
  title: string,
  newSiblingsShouldCarryType?: bool,
  shortcut: string,
  render: React$Component<*, *, *>,
  defaultNodeConfig?: () => T,
  contextMenu?: (typeData: T, node: Node, store: Store) => ?MenuResult,
}

export type Plugin = {
  id: string,
  node?: PluginNodeConfig,

  nodeTypes?: {
    [key: string]: PluginNodeTypeConfig<*>,
  },
}

