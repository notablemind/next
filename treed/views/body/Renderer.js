// @flow

import React, {Component} from 'react'
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


const processor = remark()
  .use(remarkReact)
  .use({settings: {breaks: true}})

const singleLineProcessor = remark()
  .use(remarkReact)
  .use({settings: {breaks: true}})
  .use(disable, {block: ['list', 'atxHeading', 'setextHeading']})

function disable(options) {
  var proto = this.Parser.prototype;
  ignore('blockMethods', options.block);
  ignore('inlineMethods', options.inline);

  function ignore(key, list) {
    var values = proto[key];
    var index = -1;
    var length = list && list.length;
    var pos;
    while (++index < length) {
      pos = values.indexOf(list[index]);
      if (pos !== -1) {
        values.splice(pos, 1);
      }
    }
  }
}

const text2react = content => {
  // Double-break means I want a real break here folks
  content = content.replace(/\n\n/g, '\n****\n')
  return (content.indexOf('\n') === -1 ? singleLineProcessor : processor).processSync(content).contents
}

const Renderer = ({style, content, className}: Props) => {
  return (
    <div
      style={style}
      className={css(styles.text) + ' Node_rendered ' + (className || '')}
    >
      {content.trim()
        ? text2react(content)
        : <div className={css(styles.empty)} />}
    </div>
  )
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
