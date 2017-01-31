
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import buildData from '../../../dom/public/fonts/ionicons.json'

const byName = {}
buildData.icons.forEach(icon => byName[icon.name] = String.fromCharCode(parseInt(icon.code.slice(2), 16)))

const Icon = ({name, size, color, style, className, ...props}) => (
  <div
    className={css(styles.icon) + ' ' + (className || '')}
    style={{fontSize: size, color, ...style}}
    {...props}
  >
    {byName[name] || byName['help']}
  </div>
)

export default Icon

const styles = StyleSheet.create({
  icon: {
    fontFamily: [{
      fontFamily: 'ionicons',
      fontStyle: 'normal',
      fontWeight: 'normal',
      src: 'url("/fonts/ionicons.woff") format("woff")'
    }],
  },
})

