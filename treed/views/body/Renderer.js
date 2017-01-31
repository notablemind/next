// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import textStyle from './textStyle'
import render from './render'

type Props = {
  style?: any,
  content: string,
  className?: string,
}

const Renderer = ({style, content, className}: Props) => {
  return <div style={style} className={
    css(
      styles.text,
    ) + ' Node_rendered ' + (className || '')
  }>
    {content.trim() ?
      <div dangerouslySetInnerHTML={{
        __html: render(content)
      }}/> :
      <div className={css(styles.empty)} />
    }
  </div>
}

export default Renderer

const styles = StyleSheet.create({
  text: textStyle,

  empty: {
    borderBottom: '2px dotted #ccc',
    height: '1.2em',
    padding: '4px 5px',
  },
})
css(styles.text)
