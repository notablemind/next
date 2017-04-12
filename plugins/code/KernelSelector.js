// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import DropDown from './DropDown'

const Head = ({current, plugin, toggleOpen}) => {
  return <div
    // TODO color by kernel?
    className={css(styles.head)}
    onMouseDown={e => (e.stopPropagation(), toggleOpen())}
  >
    {current.language}
  </div>
}

export default ({plugin, current, onChange}) => <DropDown
  className={css(styles.container)}
  head={toggleOpen => <Head current={current} plugin={plugin} toggleOpen={toggleOpen} />}
  body={() => <div className={css(styles.dropdown)}>
    {plugin.displayLanguages.map(lang => (
      <div
        key={lang}
        className={css(styles.item, lang === current.language && !current.kernelId && styles.itemSelected)}
        onMouseDown={() => onChange(null, lang)}
      >
        {lang}
      </div>
    ))}
  </div>}
/>

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 3,
    right: 3,
    zIndex: 1000,
  },

  item: {
    cursor: 'pointer',
    padding: '2px 4px',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  head: {
    fontSize: '.8em',
    cursor: 'pointer',
    WebkitUserSelect: 'none',
    backgroundColor: 'lightGreen',
    padding: '0px 4px',
    borderRadius: 3,
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    marginTop: 5,
    right: 0,
    minWidth: 100,
    minHeight: 20,
    backgroundColor: 'white',
    borderRadius: 4,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    fontSize: '.8em',
    overflow: 'hidden',
  },
})

