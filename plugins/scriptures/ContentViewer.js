// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import Icon from 'treed/views/utils/Icon'

export default class ContentViewer extends Component {
  state: any
  constructor() {
    super()
    this.state = {
      awesome: null,
    }
  }

  onMouseDown = (e: any) => {
    if (e.target.className === 'scripture-ref') {
      const [uri, id] = e.target.href.split('://content/')[1].split('#')
      this.props.navigateTo('/' + uri.split('?')[0], id)
    }
  }

  render() {
    return <div
      className={css(styles.container)}
      onMouseDown={this.onMouseDown}
    >
      <div
        onClick={this.props.onBack}
        className={css(styles.top)}
      >
        <Icon
          name="chevron-left"
        />
        <div className={css(styles.title)}>
          {this.props.item.title_html}
          <div className={css(styles.parentTitle)}>
          {this.props.parent}
          </div>
        </div>
      </div>
      <div className={css(styles.contents)}>
      {this.props.item.content.extras.map(paragraph => (
        <div
          key={paragraph.id}
          dangerouslySetInnerHTML={{__html: paragraph.contents}}
          className={css(styles.paragraph)}
        />
      ))}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contents: {
    flex: 1,
    overflow: 'auto',
  },

  top: {
    flexDirection: 'row',
    cursor: 'pointer',
    padding: '5px 10px',
    boxShadow: '0px 0px 5px #aaa',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  title: {
    flex: 1,
    marginLeft: 10,
    // flexDirection: '
  },

  parentTitle: {
    fontSize: '90%',
    color: '#555',
  },

  paragraph: {
    display: 'block',
    textIndent: 15,
    padding: '5px 0',
    lineHeight: 1.4,
  },
})
