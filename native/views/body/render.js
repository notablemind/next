
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  Linking,
} from 'react-native';

import Remarkable from 'remarkable'

const rem = new Remarkable({
  linkify: true,
  breaks: true,
})
// TODO use different renderer for a single line block, vs a multi-line block
// maybe
rem.block.ruler.disable(['list', 'heading', 'deflist', 'lheading'])

const cache = {}

const itemToRN = (style, oneLine, item, i) => {
  if (Array.isArray(item)) {
    const type = item[0]
    let children
    if (item[1].length === 1 && item[1][0].type === 'text') {
      children = <Text numberOfLines={oneLine ? 1 : undefined}>{item[1][0].content}</Text>
    } else {
      children = item[1].map(itemToRN.bind(null, style, oneLine))
    }
    switch (type.type) {
      case 'paragraph_open':
        return <Text numberOfLines={oneLine ? 1 : undefined} style={[styles.paragraph, style]} key={i}>{children}</Text>
      case 'em_open':
        return <Text numberOfLines={oneLine ? 1 : undefined} style={styles.em} key={i}>{children}</Text>
      case 'strong_open':
        return <Text numberOfLines={oneLine ? 1 : undefined} style={styles.strong} key={i}>{children}</Text>
      case 'link_open':
        return <Text
        numberOfLines={oneLine ? 1 : undefined}
          key={i}
          style={styles.hyperlink}
          onPress={() => Linking.openURL(type.href)}
        >{children}</Text>
      default:
        return <Text numberOfLines={oneLine ? 1 : undefined} key={i}>Type: {type} {children}</Text>
    }
  }

  switch (item.type) {
    case 'inline':
      return item.children.map(itemToRN.bind(null, style, oneLine))
    case 'text':
      return <Text numberOfLines={oneLine ? 1 : undefined} key={i}>{item.content}</Text>
    case 'code':
      return <Text numberOfLines={oneLine ? 1 : undefined} style={styles.code} key={i}>{item.content}</Text>
    case 'softbreak':
      return '\n'
    default:
      return <Text numberOfLines={oneLine ? 1 : undefined} key={i}>Type: {item.type} : {item.content}</Text>
  }
}

const styles = StyleSheet.create({
  em: {
    fontStyle: 'italic',
  },

  hyperlink: {
    color: 'blue',
    textDecorationLine: 'underline',
  },

  paragraph: {
    // fontSize: 16,
    fontWeight: '300',
  },

  strong: {
    fontWeight: 'bold',
  },

  code: {
    // fontFamily: 'monospace',
    backgroundColor: '#eee',
    color: '#555',
  },
})

const matchSides = parsed => {
  let blockStack = [['base', []]]
  parsed.forEach(item => {
    if (item.type.match(/_open$/)) {
      // what does tight mean on the paragraph_open?
      blockStack.push([item, []])
    } else if (item.type.match(/_close$/)) {
      let [type, items] = blockStack.pop()
      blockStack[blockStack.length - 1][1].push([type, items])
    } else if (item.type === 'inline') {
      blockStack[blockStack.length - 1][1].push(...matchSides(item.children))
    } else {
      blockStack[blockStack.length - 1][1].push(item)
    }
  })
  return blockStack[0][1]
}

const parsedToRN = (parsed, style, oneLine) => {
  return matchSides(parsed).map(itemToRN.bind(null, style, oneLine))
}

export default (text, style, oneLine) => {
  if (!text.trim()) {
    return <Text style={style}>empty</Text>
  }
  const key = text + style + (oneLine ? ':oneline' : '')
  if (!cache[key]) {
    try {
      cache[key] = parsedToRN(rem.parse(text, {}), style, oneLine)
      // cache[text] = <Text>{JSON.stringify(rem.parse(text, {}), null, 2)}</Text>
    } catch (e) {
      return <Text>{'Dunno' + e.message}</Text>
    }
  }
  return cache[key]
}
