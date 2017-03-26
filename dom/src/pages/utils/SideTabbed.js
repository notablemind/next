
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

export default class SideTabbed extends Component {
  state: {
    currentTab: string
  }

  constructor({tabs, sections, initialTab = null}) {
    super()
    this.state = {
      currentTab: initialTab
        ? initialTab
        : sections
        ? sections[Object.keys(sections)[0]][0]
        : Object.keys(tabs)[0],
    }
  }

  renderTabItem(title) {
    const {currentTab} = this.state
    return <div
      key={title}
      onClick={() => this.setState({currentTab: title})}
      className={css(styles.tabTitle, title === currentTab && styles.tabTitleCurrent)}
    >
      {title}
    </div>
  }

  render() {
    const {tabs, sections, className = ''} = this.props
    const {currentTab} = this.state
    return <div className={css(styles.container) + ' ' + className}>
      <div className={css(styles.leftPane)}>
        {sections
          ? Object.keys(sections).map(section => (
            <div key={section} className={css(styles.section)}>
              <div className={css(styles.sectionTitle)}>{section}</div>
              {sections[section].map(title => this.renderTabItem(title))}
            </div>
          ))
          : Object.keys(tabs).map(title => this.renderTabItem(title))}
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

  sectionTitle: {
    fontSize: '80%',
    padding: '5px 10px',
    color: '#777',
  },

  section: {
    marginBottom: 10,
  },

  leftPane: {
    width: 200,
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

