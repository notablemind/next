
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
// import {comp: Write} from './Write.re'
import DocSearcher from './DocSearcher'

let savedText = ''

export default class Open extends Component {
  state = {
    text: savedText,
  }
  searcher: any

  constructor() {
    super()
  }

  componentDidMount() {
    this.props.setSize(500, 500)
  }

  componentWillUnmount() {
    savedText = this.state.text
  }

  focus() {
    this.searcher.focus()
  }

  finish = (result: any, sticky: boolean) => {
    this.props.nm.remote.send('quick-open', {doc: result.id, sticky, root: result.root})
  }

  render() {
    return <DocSearcher
      docs={Object.values(this.props.nm.meta)}
      remote={this.props.nm.remote}
      cancel={this.props.cancel}
      onSubmit={this.finish}
      ref={n => this.searcher = n}
    />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

})