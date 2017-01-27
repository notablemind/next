// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Icon from 'treed/views/utils/Icon'
import CatalogViewer from './CatalogViewer'
import ContentViewer from './ContentViewer'

const url = last => `http://localhost:6207/api/${last}`
const get = last => fetch(url(last)).then(r => r.json())

const getCatalog = () => get('')
const getItem = id => get(id)
const getSubitem = (id, uri) => get(id + uri)
const searchByTitle = title => get('search/by-title?title=' + encodeURIComponent(title))

const debounce = (fn, by) => {
  let last = Date.now()
  let wait
  return (...args) => {
    clearTimeout(wait)
    if (Date.now() - last > by) return fn(...args)
    wait = setTimeout(() => fn(...args), by)
  }
}

class Searcher extends Component {
  state: any
  constructor(props) {
    super()
    this.state = {
      text: '',
    }
  }

  fetch = debounce(text => {
    searchByTitle(text).then(this.props.onResults)
  }, 500)

  onChange = e => {
    this.setState({text: e.target.value})
    if (e.target.value.length > 2) {
      this.fetch(e.target.value)
    } else {
      this.props.onResults([])
    }
  }

  render() {
    return <div>
      <input
        className={css(styles.input)}
        value={this.state.text}
        onChange={this.onChange}
        onKeyDown={e => e.stopPropagation()}
      />
    </div>
  }
}

export default class ScripturePane extends Component {
  state: any
  constructor({store}: any) {
    super()
    this.state = {
      library: null,
      selectedItem: null,
      subitem: null,
    }
  }

  componentDidMount() {
    getCatalog().then(library => this.setState({library}))
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
    return getSubitem('' + this.state.selectedItem._id, uri).then(subitem => this.setState({subitem}))
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

  navigateTo = (uri: string, pid: string) => {
    const nuri = this.baseUri(uri)
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

  render() {
    if (!this.state.library) return <div>Loading...</div>

    if (this.state.results && this.state.results.length && this.state.showSearch) {
      return <div className={css(styles.container)}>
        <Searcher
          key="search"
          onResults={results => this.setState({results, showSearch: true})}
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

    if (!this.state.selectedItem) {
      return <div className={css(styles.container)}>
        <Searcher
          key="search"
          onResults={results => this.setState({results, showSearch: true})}
        />
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
          onResults={results => this.setState({results, showSearch: true})}
        />
        <ContentViewer
          item={this.state.subitem}
          parent={this.state.selectedItem.title}
          onDragStart={(text, startId, endId) => {
            const {uri, subtitle, title} = this.state.subitem
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
                    subtitle,
                    title,
                    text,
                    uri,
                  },
                },
              }
            ])
            // TODO make things happen
          }}
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
      <div className={css(styles.subitems)}>
      {this.state.selectedItem.children.map(item => (
        <div
          key={item._id}
          className={css(styles.item)}
          dangerouslySetInnerHTML={{__html: item.title_html}}
          onClick={() => this.onSelectUri(item.uri)}
        />
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

  input: {
    padding: '5px 10px',
    fontSize: 16,
  },

})


