// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Icon from 'treed/views/utils/Icon'
import CatalogViewer from './CatalogViewer'
import ContentViewer from './ContentViewer'
import Searcher from './Searcher'

import {getCatalog, getItem, getSubitem, searchByTitle} from './api'

const debounce = (fn, by) => {
  let last = Date.now()
  let wait
  return (...args: Array<any>) => {
    clearTimeout(wait)
    if (Date.now() - last > by) return fn(...args)
    wait = setTimeout(() => fn(...args), by)
  }
}


const PLUGIN_ID = 'scriptures'

// Fix flow
const makeTitle = (parentTitle, startVerse: any, endVerse: any) => {
  if (!startVerse && !endVerse) return parentTitle
  if (!startVerse) startVerse = endVerse
  if (!endVerse) endVerse = startVerse
  const range = startVerse === endVerse ? startVerse : `${startVerse}-${endVerse}`
  return `${parentTitle}:${range}`
}

type Route = null | {path: 'search', query: string} | {path: 'item', uri: string}

export default class ScripturePane extends Component {
  state: {
    results: any,
    // route: Route,
    subitem: any,
    prejump: any,
    showSearch: boolean,
    library: any,
    selectedItem: any,
  }

  constructor({store}: any) {
    super()
    this.state = {
      // route: store.state.plugins[PLUGIN_ID],
      results: [],
      showSearch: true,
      library: null,
      selectedItem: null,
      subitem: null,
      prejump: null,
    }
  }

  componentDidMount() {
    getCatalog().then(library => {
      this.setState({library})
      const route = this.props.store.state.plugins[PLUGIN_ID]
      if (route) {
        if (route.path === 'search') {
          this.runSearch(route.query)
        } else if (route.path === 'item') {
          this.navigateTo(route.uri)
        }
      }
    })
  }

  dataForId = (id: string) => {
    return getItem(id).then(data => ({
      ...this.state.library.itemsById[id],
      children: Object.keys(data.items)
        .map(id => data.items[id])
        .sort((a, b) => a.position - b.position),
    }))
  }

  onSelect = (id: string) => {
    return this.dataForId(id).then(selectedItem => this.setState({selectedItem}))
  }

  onSelectUri = (uri: string) => {
    localStorage[uri] = Date.now().toString()
    this.savePath({
      path: 'item',
      uri,
    })
    return getSubitem('' + this.state.selectedItem._id, uri).then(subitem => this.setState({subitem}))
  }

  savePath = (path: Route) => {
    this.props.store.state.plugins[PLUGIN_ID] = path
    this.props.store.emit(this.props.store.events.serializableState())
  }

  baseUri = (uri: string) => {
    let parts = uri.split('/')
    while (parts.length) {
      let nuri = parts.join('/')
      if (this.state.library.uriIndex[nuri]) {
        return nuri
      }
      parts.pop()
    }
    return null
  }

  navigateTo = (uri: string) => {
    if (!uri) return
    const nuri = this.baseUri(uri)
    if (!nuri) return
    this.savePath({
      path: 'item',
      uri,
    })
    const id = this.state.library.uriIndex[nuri]
    this.dataForId(id).then(selectedItem => {
      return getSubitem(id, uri).then(subitem => this.setState({
        subitem,
        selectedItem,
        showSearch: false,
        prejump: {subitem: this.state.subitem, selectedItem: this.state.selectedItem},
      }))
    })
  }

  onSelectSearchResult = (result: any) => {
    console.log(result)
    // this.setState({results: null})
    this.onSelect(result.id)
    .then(() => this.onSelectUri(result.uri))
    .then(() => this.setState({showSearch: false}))
  }

  onDragStart = (text: string, startId: string, endId: string, startVerse: ?string, endVerse: ?string) => {
    const {uri, subtitle, title_html} = this.state.subitem
    const title = makeTitle(title_html, startVerse, endVerse)
    this.props.store.actions.startDropping([
      {
        type: 'scriptureReference',
        content: '',
        created: Date.now(),
        modified: Date.now(),
        plugins: {},
        views: {},
        types: {
          scriptureReference: {
            startId, endId,
            startVerse, endVerse,
            subtitle,
            parentTitle: title_html,
            title,
            text,
            uri,
          },
        },
      }
    ])
  }

  renderSearchResults() {
    return <div className={css(styles.container)}>
      <Searcher
        key="search"
        onSearch={this.runSearch}
      />
      <div className={css(styles.searchResults)}>
      {this.state.results.slice(0, 200).map(result => (
        <div
          key={result.uri}
          onClick={() => this.onSelectSearchResult(result)}
          className={css(styles.searchResult)}
        >
          {result.title}
          <div className={css(styles.subtitle)}>
          {result.subtitle}
          </div>
          <div className={css(styles.subtitle)}>
          {this.state.library.itemsById[result.id].title}
          </div>
        </div>
      ))}
      </div>
    </div>
  }

  runSearch = debounce(text => {
    if (text.length <= 2) {
      return this.setState({results: [], showSearch: false})
    }
    this.props.store.state.plugins[PLUGIN_ID] = {
      path: 'search',
      query: text,
    }
    this.props.store.emit(this.props.store.events.serializableState())
    searchByTitle(text).then(
      results => this.setState({results, showSearch: true})
    )
  }, 500)

  render() {
    if (!this.state.library) return <div>Loading...</div>

    if (this.state.results && this.state.results.length && this.state.showSearch) {
      return this.renderSearchResults()
    }

    if (!this.state.selectedItem) {
      return <div className={css(styles.container)}>
        <Searcher
          key="search"
          onSearch={this.runSearch}
        />
        {!this.state.showSearch && this.state.results.length ?
          <div onClick={() => this.setState({showSearch: true})}>
            Back to search results
          </div>
          : null}
        <CatalogViewer
          catalog={this.state.library.library}
          itemsById={this.state.library.itemsById}
          onSelect={this.onSelect}
        />
      </div>
    }

    if (this.state.subitem) {
      return <div className={css(styles.container)}>
        <Searcher
          key="search"
          onSearch={this.runSearch}
        />
        {!this.state.showSearch && this.state.results.length ?
          <div onClick={() => this.setState({showSearch: true})}>
            Back to search results
          </div>
          : null}
        <ContentViewer
          item={this.state.subitem}
          parent={this.state.selectedItem.title}
          onDragStart={this.onDragStart}
          onBack={() => {
            if (this.state.prejump) {
              this.setState({...this.state.prejump, prejump: null})
            } else {
              this.setState({subitem: null})
            }
          }}
          navigateTo={this.navigateTo}
        />
      </div>
    }

    return <div className={css(styles.container)}>
      <div
        className={css(styles.title)}
      >
        <Icon
          name="chevron-left"
        />
        <div
          className={css(styles.titleName)}
          onClick={() => this.setState({selectedItem: null})}
        >
          {this.state.selectedItem.title}
        </div>
      </div>
        {!this.state.showSearch && this.state.results.length ?
          <div onClick={() => this.setState({showSearch: true})}>
            Back to search results
          </div>
          : null}
      <div className={css(styles.subitems)}>
      {this.state.selectedItem.children.map(item => (
        <div
          key={item._id}
          className={css(styles.item)}
          onClick={() => this.onSelectUri(item.uri)}
        >
          <div
            dangerouslySetInnerHTML={{__html: item.title_html}}
          />
          {localStorage[item.uri]
            ? new Date(localStorage[item.uri]).toLocaleString()
            : null}
        </div>
      ))}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'auto',
    width: 300,
  },

  subitems: {
    flex: 1,
    overflow: 'auto',
  },

  title: {
    padding: '5px 10px',
    flexDirection: 'row',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  titleName: {
    marginLeft: 10,
    cursor: 'pointer',
    flex: 1,
  },

  item: {
    padding: '5px 10px',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  searchResults: {
    flex: 1,
    overflow: 'auto',
  },

  searchResult: {
    padding: '5px 10px',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  subtitle: {
    fontSize: '90%',
    color: '#555',
  },

})


