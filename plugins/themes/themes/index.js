
export type Style = {
  backgroundColor?: string,
  borderRadius?: string,
  padding?: string,
  color?: string,
  fontSize?: (number /* em */ | string /* w/ unit */),
  fontFamily?: string, // will have dropdown box for this
  fontWeight?: number, // or normal|bold|lighter|bolder?
  lineHeight?: number,
  italic?: bool,
  // padding: maybe
}

export type Theme = {
  headerStyles: Array<Style>,
  global: {
    header?: Style,
    text?: Style,
    code?: Style,
    inlineCode?: Style,
    link?: Style,
  },
  // TODO maybe enable styling of node types?
  individualStyles: {
    [key: string]: Style,
  },
  typeStyles: {
    [key: string]: Style,
  },
  viewStyles: {
    [viewType: string]: {}, // could be anything, really
  },
}

// TODO allow installation of new themes? Maybe plugins could add themes or
// something
const themes = {
  default: require('./default').default,
  blog: require('./blog').default,
  sticky: require('./sticky').default,
}

export default themes
