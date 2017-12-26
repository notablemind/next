
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import AutoGrowTextarea from './AutoGrowTextarea'
import BothSearcher from './BothSearcher'

export default class NewWrite extends Component {
  state = {
    newText: '', // idk
  }

  focus = () => this.searcher.focus()

  open(result, sticky) {
    this.props.nm.remote.send('quick-open', {doc: result.id, sticky, root: result.root})
  }

  addToScratch(text, open) {

  }

  onSubmit = (type, result, text) => {
    console.log('onSubmit', type, result, text)
    switch (type) {
      case 'click':
      case 'open':
        return this.open(result, false)
      case 'meta-click':
      case 'open-sticky':
        return this.open(result, true)
      case 'new-item':
        console.log('here we are', text, type, result)
        return this.setState({newText: text})
      case 'add-to-scratch':
        return this.addToScratch(text, false)
      case 'sticky-scratch':
        return this.addToScratch(text, true)
      case 'drill-down':
        // TODO
    }
  }

  mainSubmissionKey = e => {
    console.log(e.key)
    if (!e.metaKey) {
      // if (e.key === 'Enter') {
      //   console.log('here')
      //   return 'drill-down'
      // }
      return
    }
    switch (e.key) {
      case 'o': return 'open'
      case 's': return 'open-sticky'
      case 'Enter': return 'new-item'
      case 'a': return 'add-to-scratch'
      case 'p': return 'sticky-scratch'
    }
  }

  mainShortcuts = [
    ['cmd+o', 'open a new window'],
    ['cmd+s', 'open a sticky note'],
    ['cmd+enter', 'create a new node with text, and select target'],
    ['cmd+a', 'add to scratch document'],
    ['cmd+p', 'open a sticky note in scratch document'],
  ]

  secondSubmissionKey = e => {
    if (!e.metaKey) {
      if (e.key === 'Enter') {
        return 'select'
      }
      return
    }
    switch (e.key) {
      case 'Enter': return 'dive'
      case 's': return 'add-sticky'
    }
  }

  secondShortcuts = [
    ['enter', 'add to selected node'],
    ['cmd+enter', 'dive into node'],
    ['cmd+s', 'createt sticky note'],
  ]

  render() {
    if (this.state.newText) {
      return <div className={css(styles.container)}>
        {this.state.newText}
        <BothSearcher
          shortcuts={this.secondShortcuts}
          submissionKey={this.secondSubmissionKey}
          docs={Object.values(this.props.nm.meta)}
          remote={this.props.nm.remote}
          cancel={this.props.cancel}
          onSubmit={this.onSubmit}
          focusUp={() => this.setState({newText: ''})}
          ref={n => this.searcher = n}
        />
      </div>
    }

    return <div className={css(styles.container)}>
      <BothSearcher
        shortcuts={this.mainShortcuts}
        submissionKey={this.mainSubmissionKey}
        docs={Object.values(this.props.nm.meta)}
        remote={this.props.nm.remote}
        cancel={this.props.cancel}
        onSubmit={this.onSubmit}
        ref={n => this.searcher = n}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})