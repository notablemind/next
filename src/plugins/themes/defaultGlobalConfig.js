
export type Style = {
  backgroundColor?: ?string,
  color?: ?string,
  fontSize?: ?number, // em
  fontFamily?: ?string, // will have dropdown box for this
  fontWeight?: ?number, // or normal|bold|lighter|bolder?
  lineHeight?: ?number,
  italic?: bool,
  // padding: maybe
}

export type ThemeSettings = {
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

const defaultGlobalConfig: ThemeSettings = {
  indentType: 'lines',
  headerStyles: [{
    style: header1,
    level: 0,
    enabled: true,
  }, {
    style: header2,
    level: 1,
    enabled: false,
  }, {
    style: header3,
    level: 2,
    enabled: false,
  }],

  individualStyles: {
    highlighted: {
      name: 'highlighted',
      shortcut: 'h',
      style: {
        backgroundColor: '#ffff79',
      },
    },
    pink: {
      name: 'pink',
      shortcut: 'p',
      style: {
        backgroundColor: '#ffe9f5',
      },
    },
    disabled: {
      name: 'disabled',
      shortcut: 'd',
      style: {
        color: '#aaa',
        italic: true,
      },
    },
    bold: {
      name: 'bold',
      shortcut: 'b',
      style: {
        fontWeight: 'bold',
      },
    },
    italic: {
      name: 'italic',
      shortcut: 'i',
      style: {
        italic: true,
      },
    },
    header1: {
      name: 'header1',
      style: header1,
      shortcut: '1',
    },
    header2: {
      name: 'header2',
      style: header2,
      shortcut: '2',
    },
    header3: {
      name: 'header3',
      style: header3,
      shortcut: '3',
    },
  },
}

export default defaultGlobalConfig

