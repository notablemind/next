
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import NotableClient from '../../../../electron/src/NotableClient'
import Write from './Write'
// import {comp as Write} from './Write.re'

const Sticky = () => <div>sticky...</div>
const Open = () => <div>open...</div>

const tabs: Array<{id: string, name: string, component: any}> = [{
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

const browserWindow = require('electron').remote.getCurrentWindow()

export default class App extends Component {
  current: any
  nm: NotableClient
  constructor() {
    super()
    browserWindow.on('show', () => {
      if (this.current && this.current.focus) this.current.focus()
    })
    browserWindow.on('blur', () => browserWindow.hide())
    this.nm = new NotableClient(arg => console.log('toasty', arg))
  }
  state = {
    tab: tabs[0],
    loading: true,
  }

  componentDidMount() {
    this.nm.init().then(() => this.setState({loading: false}))
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
    if (this.state.loading) {
      return <div className={css(styles.container)}>
        Loading...  
      </div>
    }

    const Component = this.state.tab.component
    return <div className={css(styles.container)}>
      <div className={css(styles.tabs)}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={css(styles.tab, tab === this.state.tab && styles.selected)}
          onMouseDown={e => {
            e.preventDefault()
            this.setState({tab: tab})
          }}
        >
          {tab.name}
        </div>
      ))}
      </div>
      <Component
        onPrev={this.onPrev}
        onNext={this.onNext}
        setSize={(width, height) => browserWindow.setSize(width, height)}
        cancel={() => browserWindow.hide()}
        ref={comp => this.current = comp}
        nm={this.nm}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  tabs: {
    flexDirection: 'row',
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 400,
    // textTransform: 'uppercase',
    ':hover': {
      backgroundColor: '#ddd',
    },
  },

  selected: {
    backgroundColor: '#eee',
  }
})