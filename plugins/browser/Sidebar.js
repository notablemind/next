// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

export default class Sidebar extends Component {
  state: {
    width: number,
    links: string[],
    selected: number,
  }
  constructor() {
    super()
    this.state = {
      width: 800,
      links: [],
      selected: 0,
    }
  }

  componentDidMount() {
    window.addEventListener('click', this.onClick)
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onClick)
  }

  onClick = (e: any) => {
    if (e.button !== 0) return
    if (e.target.nodeName === 'A') {
      if (e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        this.setState({
          links: this.state.links.concat([e.target.href]),
          selected: this.state.links.length,
        })
      }
    }
  }

  render() {
    const {selected=0, links, width} = this.state
    return <div
      className={css(styles.container)}
      style={{width: width}} // TODO make dynamic
    >
      <div className={css(styles.top)}>
        {links.map((link, i) => (
          <div
            onClick={() => this.setState({selected: i})}
            className={css(styles.tab, i === selected && styles.selectedTab)} key={i}>
            {shortened(link)}
          </div>
        ))}
      </div>
      <iframe
        className={css(styles.iframe)}
        src={links[selected]}
      />
    </div>
  }
}

const shortened = link => link.split('//')[1].split('/')[0]

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  iframe: {
    flex: 1,
    alignSelf: 'stretch',
    border: 'none',
  },

  top: {
    flexDirection: 'row',
    overflow: 'auto',
  },

  tab: {
    width: 30,
    overflow: 'hidden',
    padding: '3px 5px',
    cursor: 'pointer',
  },

  selectedTab: {
    width: 'auto',
    // flexGrow: 1,
  },
})

