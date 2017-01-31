
import React from 'react'
import {StyleSheet, css} from 'aphrodite'

import Content from 'treed/views/body/Content'
import Icon from 'treed/views/utils/Icon'

const ScriptureReference = ({
  node: {types: {
    scriptureReference: {
      uri,
      startId,
      endId,
      text,
      title,
      subtitle,
    },
  }
}, store}) => (
  <div className={css(styles.container)}>
    <div className={css(styles.text)}>
      <Icon name="quote" className={css(styles.quote)} />
      {text}
    </div>
    <div className={css(styles.title)}>
      {title}
    </div>
    {subtitle && <div className={css(styles.subtitle)}>
      {subtitle}
    </div>}
  </div>
)

export default ScriptureReference

const styles = StyleSheet.create({
  title: {
    fontSize: '80%',
    color: '#666',
    fontWeight: '400',
    textAlign: 'center',
  },

  quote: {
    display: 'inline',
    color: '#00d9dc',
    paddingRight: 5,
    // fontSize: 10,
  },

  text: {
    fontSize: '90%',
    display: 'block',
    hyphens: 'auto',
    lineHeight: 1.4,
  },

  container: {
    padding: 5,
  },

  subtitle: {
    fontSize: '70%',
    color: '#888',
    textAlign: 'center',
  },
})
