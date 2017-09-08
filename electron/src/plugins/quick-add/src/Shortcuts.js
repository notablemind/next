// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

const Shortcuts = ({cuts}) => <div className={css(styles.shortcuts)}>
  {cuts.map((cut, i) => (
    <div className={css(styles.shortcut)} key={i}>
      <div className={css(styles.shortcutKey)}>
        {cut[0]}
      </div>
      <div className={css(styles.shortcutDesc)}>
        {cut[1]}
      </div>
    </div>
  ))}
</div>

export default Shortcuts

const styles = StyleSheet.create({
  shortcuts: {
    fontSize: '.8em',
    padding: 3,
  },

  shortcut: {
    flexDirection: 'row',
    marginTop: 3,
  },

  shortcutKey: {
    fontFamily: 'monospace',
    backgroundColor: '#777',
    color: 'white',
    fontWeight: 'normal',
    fontSize: '1.1em',
    borderRadius: 3,
    padding: '2px 3px',
    marginRight: 3,
  }
})
