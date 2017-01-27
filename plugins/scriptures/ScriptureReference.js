
import React from 'react'
import {StyleSheet, css} from 'aphrodite'

import Content from 'treed/views/body/Content'

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
  <div>
    <div>
      {text}
    </div>
    <div>
      {title}
    </div>
    <div>
      {subtitle}
    </div>
  </div>
)

export default ScriptureReference

const styles = StyleSheet.create({
})
