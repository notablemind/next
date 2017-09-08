
import type {Style, Theme} from './'
import defaultIndividualStyles from './defaultIndividualStyles'

// TODO change these, they're kinda weird
const header1 = {
  fontSize: 1.5,
  fontWeight: 'normal',
  // italic: true,
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

const header4 = {
  fontSize: 1.0,
  fontWeight: 'normal',
  color: '#5385ff',
  italic: false,
}

const header5 = {
  fontSize: 0.9,
  fontWeight: 'normal',
  italic: true,
}

const theme: Theme = {
  title: 'Default',

  headerStyles: [
    header1,
    header2,
    header3,
    header4,
    header5,
  ],

  global: {
    header: {
      fontFamily: 'OpenSans',
    },
    text: {
      fontFamily: 'OpenSans',
      fontWeight: '200',
      fontSize: '16px', // TODO this should become '1em' I think I need to set it on the wrapper
    },
    inlineCode: {
    },
  },

  individualStyles: defaultIndividualStyles({header1, header2, header3, header4, header5}),

  viewStyles: {
  },
}

export default theme

