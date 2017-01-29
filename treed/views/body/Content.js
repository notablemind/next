// @-flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Editor from './Editor'
import Renderer from './Renderer'

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
    />
  }
  return <Renderer
    style={props.style}
    content={props.node.content}
  />
}
