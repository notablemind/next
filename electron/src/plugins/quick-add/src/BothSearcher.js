
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import ipcPromise from '../../../../electron/src/ipcPromise'
import Searcher from './Searcher'
import {searchDocs, debounce} from './searching'
import Shortcuts from './Shortcuts'

import type {Result} from './Searcher'

const DEBOUNCE = 200

export default class BothSearcher extends Component {
  constructor({docs}: any) {
    super()
    this.state = {
      text: '',
      results: searchDocs(docs, ''),
      fullResults: [],
    }
  }

  state: {
    text: string,
    results: Result[],
    fullResults: Result[],
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
    // fullResults: docs.length > 0 ? [] : this.state.fullResults,
    this.fullSearch(text)
  }

  fullSearch: (a: string) => void = debounce((text: string) => {
    if (!text.length) return this.setState({fullResults: []})
    this.remoteProm.send('full-search', text).catch(() => [])
      .then(fullResults => this.setState(
        state => state.text === text ? {fullResults} : {}
      ))
  }, DEBOUNCE)

  onSubmit = (type, result) => {
    this.props.onSubmit(type, result, this.state.text)
    this.setState({text: '', results: [], fullResults: []})
  }

  shortcuts() {
    return <Shortcuts cuts={this.props.shortcuts || [
      ['enter', 'Open document in new window'],
      ['cmd+s, cmd+enter', 'Open document in sticky note'],
    ]} />
  }

  render() {
    return <Searcher
      ref={n => this.searcher = n}
      placeholder="Search by document title or node content"
      subtext={this.shortcuts()}
      onChange={this.onChange}
      onSubmit={this.onSubmit}
      focusUp={this.props.focusUp}
      submissionKey={this.props.submissionKey}
      results={this.state.results.concat(this.state.fullResults)}
    />
  }
}
