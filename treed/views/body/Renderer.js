// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import textStyle from './textStyle'
// import render from './render'

import remark from 'remark'
import remarkReact from 'remark-react'

type Props = {
  style?: any,
  content: string,
  className?: string,
}

window.rr = remark

const text2react = content => {
  return remark().use(remarkReact).processSync(content).contents
  /*
  return <div dangerouslySetInnerHTML={{
    __html: render(content)
  }}/>
  */
}

const Renderer = ({style, content, className}: Props) => {
  return <div style={style} className={
    css(
      styles.text,
    ) + ' Node_rendered ' + (className || '')
  }>
    {content.trim() ?
      text2react(content) :
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
