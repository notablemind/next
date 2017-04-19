// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import DropDown from './DropDown'

const Head = ({current, plugin, toggleOpen}) => {
  const hasKernel = current.kernelId && plugin.config.kernels[current.kernelId]
  return <div
    // TODO color by kernel?
    className={css(styles.head, hasKernel && styles.headKernel) + ' _head'}
    onMouseDown={e => (e.stopPropagation(), toggleOpen())}
  >
    {hasKernel
      ? plugin.config.kernels[current.kernelId].title
      : current.language}
  </div>
}

export default ({plugin, current, inline, onChange}) => <DropDown
  className={css(styles.container, inline && styles.containerInline) + ' kernel_selector'}
  head={toggleOpen => <Head current={current} plugin={plugin} toggleOpen={toggleOpen} />}
  body={toggleOpen => <div className={css(styles.dropdown)}>
    {Object.values(plugin.config.kernels).map(kernelConfig => (
      <div
        key={kernelConfig.id}
        className={css(styles.item,
                       kernelConfig.language === current.language
                       && current.kernelId === kernelConfig.id
                       && styles.itemSelected)}
        onMouseDown={() => (toggleOpen(), onChange(kernelConfig.id, kernelConfig.language))}
      >
        {kernelConfig.title}
      </div>
    ))}
    {plugin.displayLanguages.map(lang => (
      <div
        key={lang}
        className={css(styles.item, lang === current.language && !current.kernelId && styles.itemSelected)}
        onMouseDown={() => (toggleOpen(), onChange(null, lang))}
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

    ':hover': {
      '>_head': {
        // opacity: 1,
      },
    },
  },

  containerInline: {
    position: 'static',
    top: 0,
    left: 0,
  },

  item: {
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    padding: '2px 4px',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  head: {
    zIndex: 1000,
    fontSize: '.8em',
    cursor: 'pointer',
    WebkitUserSelect: 'none',
    padding: '0px 4px',
    borderRadius: 3,
    color: '#777',
    // opacity: 0.3,

    ':hover': {
      // opacity: 1,
    },
  },

  headKernel: {
    backgroundColor: 'lightGreen',
    color: 'black',
  },

  dropdown: {
    zIndex: 10001,
    position: 'absolute',
    top: '100%',
    marginTop: 5,
    right: 0,
    // minWidth: 100,
    // minHeight: 20,
    backgroundColor: 'white',
    borderRadius: 4,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    fontSize: '.8em',
    overflow: 'hidden',
  },
})

