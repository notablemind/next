
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

export default class SideTabbed extends Component {
  state: {
    currentTab: string
  }

  constructor({tabs}) {
    super()
    this.state = {
      currentTab: Object.keys(tabs)[0],
    }
  }

  render() {
    const {tabs, className = ''} = this.props
    const {currentTab} = this.state
    return <div className={css(styles.container) + ' ' + className}>
      <div className={css(styles.leftPane)}>
        {Object.keys(tabs).map(title => (
          <div
            key={title}
            onClick={() => this.setState({currentTab: title})}
            className={css(styles.tabTitle, title === currentTab && styles.tabTitleCurrent)}>
            {title}
          </div>
        ))}
      </div>
      <div className={css(styles.rightPane)}>
        {this.props.tabs[this.state.currentTab]()}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  leftPane: {
    width: 100,
    paddingRight: 10,
  },

  rightPane: {
    flex: 1,
  },

  tabTitle: {
    padding: '5px 10px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#eee',
    },
  },

  tabTitleCurrent: {
    backgroundColor: '#ddd',
  },
})

