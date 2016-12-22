
type Style = {
  backgroundColor?: ?string,
  color?: ?string,
  fontSize?: ?number, // em
  fontFamily?: ?string, // will have dropdown box for this
  fontWeight?: ?number, // or normal|bold|lighter|bolder?
  lineHeight?: ?number,
  italic?: bool,
  // padding: maybe
}

type ThemeSettings = {
  indentType: 'dots' | 'lines',
  headerStyles: Array<{
    style: Style,
    level: number,
    enabled: bool,
  }>,
  // TODO maybe enable styling of node types?
  individualStyles: {
    [key: string]: Style,
  },
}

const header1 = {
  fontSize: 1.5,
  fontWeight: 'normal',
  italic: true,
}

const header2 = {
  fontSize: 1.3,
  fontWeight: 'normal',
  color: '#5385ff',
}

const header3 = {
  fontSize: 1.1,
  fontWeight: 'normal',
  italic: true,
}

export const defaultConfig: ThemeSettings = {
  indentType: 'lines',
  headerStyles: [{
    style: header1,
    level: 0,
    enabled: true,
  }, {
    style: header2,
    level: 1,
    enabled: true,
  }, {
    style: header3,
    level: 2,
    enabled: true,
  }],
  individualStyles: {
    highlighted: {
      backgroundColor: 'yellow',
    },
    pink: {
      backgroundColor: 'pink',
    },
    disabled: {
      color: '#aaa',
      italic: true,
    },
    bold: {
      fontWeight: 'bold',
    },
    italic: {
      italic: true,
    },
    header1,
    header2,
    header3,
  },
}

export default {
  id: 'theme',
  defaultDocumentConfig,
  // defaultNodeConfig: null,

  contextMenu(documentConfig, nodeConfig, id, store) {
    return Object.keys(documentConfig.individualStyles).map(name => ({
      name,
      enabled: nodeConfig === name,
      action: () => store.actions.setPluginConfig('theme', name),
    }))
  },
}

