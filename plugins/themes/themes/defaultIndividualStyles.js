
const styles = ({header1, header2, header3}) => ({
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
});

export default styles
