
import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import ipcPromise from '../../../../electron/src/ipcPromise'
import Searcher from './Searcher'
import {searchDocs, debounce} from './searching'

import type {Result} from './Searcher'

const DEBOUNCE = 200

export default class DocSearcher extends Component {
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
    this.remoteProm.send('full-search', text).catch(() => [])
      .then(fullResults => this.setState(
        state => state.text === text ? {fullResults} : {}
      ))
  }, DEBOUNCE)

  render() {
    return <Searcher
      ref={n => this.searcher = n}
      placeholder="Search by document title or node content"
      onChange={this.onChange}
      results={this.state.results.concat(this.state.fullResults)}
    />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})