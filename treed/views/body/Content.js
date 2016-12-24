// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Editor from './Editor'

export default ({node, actions, editState, style}) => {
  if (editState) {
    return <Editor
      style={style}
      node={node}
      actions={actions}
      editState={editState}
      className={css(styles.text) + ' Node_input'}
    />
  }
  return <div style={style} className={
    css(
      styles.text,
    ) + ' Node_rendered'
  }>
    {node.content.trim() ? node.content : <div className={css(styles.empty)} />}
  </div>
}

const styles = StyleSheet.create({
  text: {
    fontSize: '1em',
    margin: 0,
    padding: 0,
    border: 'none',
    fontFamily: 'sans-serif',
    outline: 'none',
    lineHeight: '1.2em',
    backgroundColor: 'transparent',
    padding: '4px 5px',
  },

  empty: {
    borderBottom: '2px dotted #ccc',
    height: '1.2em',
    padding: '4px 5px',
  },


})
