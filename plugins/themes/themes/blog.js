
import defaultIndividualStyles from './defaultIndividualStyles'

// TODO check out http://fontpair.co/
const headerFont = 'OpenSans'
const textFont = 'LinuxLibertine'

const header1 = {
  fontSize: 2,
  lineHeight: 1.1,
}

const header2 = {
  fontSize: 1.3,
}

const header3 = {
  fontSize: 1.1,
}

const header4 = {
  fontSize: 1.0,
}

const theme: ThemeSettings = {
  title: 'Blog',
  headerStyles: [
    header1,
    header2,
    header3,
    header4,
  ],

  global: {
    text: {
      fontFamily: textFont,
      fontWeight: 'normal',
      fontSize: '22px',
      lineHeight: 1.5,
      // paddingBottom: '20px',
      WebkitFontSmoothing: 'antialiased',
      hyphens: 'auto',
    },

    header: {
      fontFamily: headerFont,
      fontWeight: 'bold',
    },

    inlineCode: {
      fontSize: 0.8,
      backgroundColor: '#eee',
      whiteSpace: 'pre-wrap',
      // backgroundColor: 'red',
    },

    code: {
      fontSize: 0.6,
      display: 'block',
      borderRadius: 5,
      whiteSpace: 'pre-wrap',
      backgroundColor: '#eee',
    },

    link: {
    },
  },

  types: {
    note: {
      container: {
        backgroundColor: '#ddd',
        borderLeft: '5px solid #aaa',
        paddingLeft: '10px',
      },
      body: {
        fontWeight: 'bold',
      },
    },
  },

  individualStyles: defaultIndividualStyles({header1, header2, header3}),

  viewStyles: {
    list: {
      indentStyle: 'minimal',
      maxWidth: 700,
    },
  },
}

export default theme


