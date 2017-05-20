
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import Write from './Write'

const Sticky = () => <div>sticky...</div>
const Open = () => <div>open...</div>

const tabs = [{
  id: 'write',
  name: 'Write',
  component: Write,
}, {
  id: 'sticky',
  name: 'Sticky note',
  component: Sticky,
}, {
  id: 'open',
  name: 'Open',
  component: Open,
}]

export default class App extends Component {
  state = {
    tab: tabs[0],
  }

  onPrev = () => {
    const idx = tabs.indexOf(this.state.tab)
    let tab
    if (idx === 0) tab = tabs[tabs.length - 1]
    else tab = tabs[idx - 1]
    this.setState({tab})
  }

  onNext = () => {
    const idx = tabs.indexOf(this.state.tab)
    let tab
    if (idx === tabs.length - 1) tab = 0
    else tab = tabs[idx + 1]
    this.setState({tab})
  }

  render() {
    const Component = this.state.tab.component
    return <div className={css(styles.container)}>
      {tabs.map(tab => (
        <div
          className={css(styles.tab, tab === this.state.tab && styles.selected)}
          onClick={() => this.setState({tab: tab})}
        >
          {tab.name}
        </div>
      ))}
      <Component
        onPrev={this.onPrev}
        onNext={this.onNext}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
  },
})
