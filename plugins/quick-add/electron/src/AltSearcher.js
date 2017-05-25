// Alternates

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
      selectedDoc: null,
    }
  }

  state: {
    text: string,
    results: Result[],
    selectedDoc: ?Result,
  }
  remoteProm: any

  componentDidMount() {
    this.searcher.focus()
    this.remoteProm = ipcPromise(this.props.remote)
  }

  focus = () => this.searcher.focus()

  onChange = text => {
    if (this.state.selectedDoc) {
      this.setState({text})
      this.fullSearch(text)
    } else {
      const results = searchDocs(this.props.docs, text)
      this.setState({text, results})
    }
  }

  onSubmit = (result, sticky) => {
    this.props.onSubmit(result, sticky)
    this.setState({text: '', results: []})
  }

  fullSearch: (a: string) => void = debounce((text: string) => {
    // if (!text.length) return this.setState({results: []})
    this.remoteProm.send('doc-search', {docid: this.state.selectedDoc.id, text}).catch(() => [])
      .then(results => this.setState(
        state => state.text === text ? {results} : {}
      ))
  }, DEBOUNCE)

  render() {
    return <Searcher
      ref={n => this.searcher = n}
      inputLeft={this.state.selectedDoc &&
        <div className={css(styles.titlePreview)}>{this.state.selectedDoc.title}</div>
        }
      placeholder={this.state.selectedDoc
        ? 'Search within doc'
        : "Select target document"}
      onChange={this.onChange}
      text={this.state.text}
      onSubmit={(result, sticky) => {
        if (this.state.selectedDoc || sticky) {
          return this.props.onSubmit(result, sticky)
        }
        this.setState({selectedDoc: result, text: '', results: []})
        this.fullSearch('')
      }}
      focusUp={() => this.state.selectedDoc
        ? this.setState({selectedDoc: null, text: '', results: searchDocs(this.props.docs, '')})
        : this.props.focusUp()}
      results={this.state.results}
    />
  }
}

const styles = StyleSheet.create({
  titlePreview: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    maxWidth: 200,
    display: 'block',
    backgroundColor: '#eee',
    borderRadius: 3,
    padding: 5,
    margin: 5,
    // alignItems: 'center',
    // flexDirection: 'row',
    // justifyContent: 'center',    
  }
})
