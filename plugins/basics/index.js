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

      childContainer: ({id, index, child}) => {
        return <div key={id + '-' + index} className={css(styles.listItem)}>
          <div className={css(styles.dot)} />
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

      childContainer: ({id, index, child}) => {
        return <div key={id + '-' + index} className={css(styles.listItem)}>
          <div className={css(styles.number)}>{index + 1}</div>
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
    backgroundColor: 'currentColor',
    marginTop: 12,
    marginRight: 8,
    width: 7,
    height: 7,
    borderRadius: '50%',
  },

  rest: {
    flex: 1,
  },
})

export default plugin
