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

      className: ({id, node, depth}) => `Header-${depth}`,
    },

    list: {
      title: 'List',
      newSiblingsShouldCarryType: false,
      shortcut: 'l',

      childContainer: ({id, index, child}) => {
        return <div className={css(styles.listItem)}>
          <div className={css(styles.dot)} /> {child}
        </div>
      },
    },

    orderedList: {
      title: 'Ordered list',
      newSiblingsShouldCarryType: false,
      shortcut: 'o',

      childContainer: ({id, index, child}) => {
        return <div className={css(styles.listItem)}>
          <div className={css(styles.number)}>{index + 1}</div> {child}
        </div>
      },
    },

    quote: {
      title: 'Quote',
      newSiblingsShouldCarryType: false,
      shortcut: 'q',

      render: null, // TODO make this
    },

    code: {
      title: 'Code block',
      newSiblingsShouldCarryType: false,
      shortcut: 'c',

      render: null, // TODO make this
    },

    note: {
      title: 'Note',
      newSiblingsShouldCarryType: false,
      // shortcut: 'n',

      render: null, // TODO make this too
    },
  },
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
  },

  dot: {
    backgroundColor: 'black',
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
})

export default plugin
