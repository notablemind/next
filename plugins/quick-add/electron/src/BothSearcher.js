
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import ipcPromise from '../../../../electron/src/ipcPromise'
import Searcher from './Searcher'
import {searchDocs, debounce} from './searching'

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

  onSubmit = (result, sticky) => {
    this.props.onSubmit(result, sticky)
    this.setState({text: '', results: [], fullResults: []})
  }

  render() {
    return <Searcher
      ref={n => this.searcher = n}
      placeholder="Search by document title or node content"
      onChange={this.onChange}
      onSubmit={this.props.onSubmit}
      focusUp={this.props.focusUp}
      results={this.state.results.concat(this.state.fullResults)}
    />
  }
}
