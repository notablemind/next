// @-flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import render from './render'

import Editor from './Editor'

type Props = {
  node: any,
  actions: any,
  editState: any,
  style?: any,
}

export default (props: Props) => {
  if (props.editState) {
    return <Editor
      {...props}
      className={css(styles.text) + ' Node_input'}
    />
  }
  return <div style={props.style} className={
    css(
      styles.text,
    ) + ' Node_rendered'
  }>
    {props.node.content.trim() ? <div dangerouslySetInnerHTML={{__html: render(props.node.content)}}/> :
      <div className={css(styles.empty)} />}
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
    cursor: 'inherit',
  },

  empty: {
    borderBottom: '2px dotted #ccc',
    height: '1.2em',
    padding: '4px 5px',
  },

})
