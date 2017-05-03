// @flow

import type {Plugin} from 'treed/types'
import React from 'react'
import {css, StyleSheet} from 'aphrodite'

const PLUGIN_ID = 'basics'

const plugin: Plugin<void, void> = {
  id: PLUGIN_ID,

  nodeTypes: {
    header: {
      title: 'Header',
      newSiblingsShouldCarryType: true,
      shortcut: 'h',

      className: ({id, node, depth}) => `Header Header-${depth}`,
    },

    list: {
      title: 'List',
      newSiblingsShouldCarryType: false,
      shortcut: 'l',

      childContainer: ({id, index, child, indentStyle}) => {
        return <div key={id + '-' + index} className={css(styles.listItem)}>
          <div className={css(styles.listMarker, indentStyle === 'minimal' && styles.wideDot)}>
          <div className={css(styles.dot)} />
          </div>
          <div className={css(styles.rest)}>
          {child}
          </div>
        </div>
      },
    },

    orderedList: {
      title: 'Ordered list',
      newSiblingsShouldCarryType: false,
      shortcut: 'o',

      childContainer: ({id, index, child, indentStyle}) => {
        return <div key={id + '-' + index} className={css(styles.listItem)}>
          <div className={css(styles.listMarker, indentStyle === 'minimal' && styles.wideDot)}>
          <div className={css(styles.number)}>{index + 1}</div>
          </div>
          <div className={css(styles.rest)}>
          {child}
          </div>
        </div>
      },
    },

    quote: {
      title: 'Quote',
      newSiblingsShouldCarryType: false,
      shortcut: 'q',

      render: null, // TODO make this
    },

    note: {
      title: 'Note',
      newSiblingsShouldCarryType: false,
      containerClassName: node => css(styles.noteContainer),
      // shortcut: 'n',

      render: null, // TODO make this too
    },
  },
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
  },

  listMarker: {
    height: 30 + 8,
    width: 30,
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listMarkerMinimal: {
    width: 40,
  },

  dot: {
    backgroundColor: 'currentColor',
    // marginTop: 12,
    // marginRight: 8,
    width: 7,
    height: 7,
    borderRadius: '50%',
  },

  wideDot: {
    // marginRight: 15,
    // marginLeft: 10,
  },

  rest: {
    flex: 1,
  },

  noteContainer: {
    backgroundColor: 'gray',
  },
})

export default plugin
