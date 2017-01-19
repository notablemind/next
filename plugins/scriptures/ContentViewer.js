// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import Icon from 'treed/views/utils/Icon'

export default class ContentViewer extends Component {
  constructor() {
    super()
    this.state = {
      awesome: null,
    }
  }

  render() {
    return <div className={css(styles.container)}>
      <div
        onClick={this.props.onBack}
        className={css(styles.top)}
      >
        <Icon
          name="chevron-left"
        />
        <div className={css(styles.title)}>
          {this.props.item.title_html}
        </div>
      </div>
      {this.props.item.content.extras.map(paragraph => (
        <div
          key={paragraph.id}
          dangerouslySetInnerHTML={{__html: paragraph.contents}}
          className={css(styles.paragraph)}
        />
      ))}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 300,
    overflow: 'auto',
  },

  top: {
    flexDirection: 'row',
    cursor: 'pointer',
    padding: '5px 10px',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  title: {
    flex: 1,
    marginLeft: 10,
  },

  paragraph: {
    display: 'block',
    textIndent: 15,
    padding: '5px 0',
    lineHeight: 1.4,
  },
})
