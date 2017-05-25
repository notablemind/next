
import React, {Component} from 'react'

import Searcher from './Searcher'
import {searchDocs} from './searching'

import type {Result} from './Searcher'

export default class DocSearcher extends Component {
  constructor({docs}: any) {
    super()
    this.state = {
      text: '',
      results: searchDocs(docs, ''),
    }
  }

  state: {
    text: string,
    results: Result[],
  }
  remoteProm: any

  componentDidMount() {
    this.searcher.focus()
    this.remoteProm = ipcPromise(this.props.remote)
  }

  focus = () => this.searcher.focus()

  onChange = text => {
    const results = searchDocs(this.props.docs, text)
    this.setState({text, results})
  }

  onSubmit = (result, sticky) => {
    this.props.onSubmit(result, sticky)
    this.setState({text: '', results: []})
  }

  render() {
    return <Searcher
      ref={n => this.searcher = n}
      placeholder="Select target document"
      onChange={this.onChange}
      onSubmit={this.props.onSubmit}
      focusUp={this.props.focusUp}
      results={this.state.results}
    />
  }
}
