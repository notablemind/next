// Alternates

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import ipcPromise from '../../../../electron/src/ipcPromise'
import Searcher from './Searcher'
import {searchDocs, debounce} from './searching'
import Shortcuts from './Shortcuts'

import type {Result} from './Searcher'

const DEBOUNCE = 200

export default class AltSearcher extends Component {
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
    const plainResult = {
      ...this.state.selectedDoc,
      title: '*Document root*',
    }
    // if (!text.length) return this.setState({results: []})
    this.remoteProm.send('doc-search', {docid: this.state.selectedDoc.id, text}).catch(() => [])
      .then(results => this.setState(
        state => state.text === text ? {results: [plainResult].concat(results)} : {}
      ))
  }, DEBOUNCE)

  shortcuts() {
    return this.state.selectedDoc
      ? [
        ['enter', 'add as child of selected node'],
        ['cmd+s, cmd+enter', 'add & open sticky note'],
      ]
      : [
        ['enter', 'search within document'],
        ['cmd+enter', 'add as child of document root'],
        ['cmd+s', 'add & open sticky note'],
      ]
  }

  resetDoc = () => {
    this.setState({selectedDoc: null, text: '', results: searchDocs(this.props.docs, '')})
  }

  render() {
    return <Searcher
      ref={n => this.searcher = n}
      inputLeft={
        this.state.selectedDoc &&
        <div className={css(styles.titlePreview)}>{this.state.selectedDoc.title}</div>
      }
      subtext={<Shortcuts cuts={this.shortcuts()} />}
      placeholder={this.state.selectedDoc
        ? 'Search within doc'
        : "Select target document"}
      onChange={this.onChange}
      text={this.state.text}
      onBackspace={() => {
        if (this.state.selectedDoc) {
          this.resetDoc()
        }
      }}
      onSubmit={(result, cmdKey, cmdS) => {
        if (this.state.selectedDoc || cmdKey) {
          return this.props.onSubmit(result, this.state.selectedDoc ? cmdKey : cmdS)
        }
        this.setState({selectedDoc: result, text: '', results: []})
        this.fullSearch('')
      }}
      focusUp={() => this.state.selectedDoc
        ? this.resetDoc()
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
  },
})
