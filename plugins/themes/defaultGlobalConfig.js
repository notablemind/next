
import type {Style} from './themes'

export type GlobalConfig = {
  theme: string,
  overrides: {
    [themeId: string]: {
      global?: {
        header?: Style,
        text?: Style,
        code?: Style,
        inlineCode?: Style,
        link?: Style,
      },
      headerStyles?: Array<Style>,
      individualStyles?: {
        [key: string]: Style,
      },
      typeStyles?: {
        [key: string]: Style,
      },
      viewStyles?: {
        [viewType: string]: {}, // could be anything, really
      },
    }
  },
}

const defaultGlobalConfig = {
  theme: 'default',
  overrides: {},
}

export default defaultGlobalConfig

