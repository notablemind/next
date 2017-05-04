// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import SearchItem from './SearchItem'
import BouncyInput from './BouncyInput'
import Tags from './TagsSearch'

type State = {}

const nonempty = txt => (txt.length ? txt : null)

const walk = (nodes, id, fn) => {
  fn(nodes[id])
  nodes[id].children.forEach(id => walk(nodes, id, fn))
}

const findResultsForTags = (tagIds, searchText, store) => {
  const results = []
  const needle = nonempty(searchText.trim().toLowerCase())
  walk(store.db.data, store.state.root, node => {
    if (!node.plugins.tags || !node.plugins.tags.length) {
      return
    }
    const missing = tagIds.some(id => node.plugins.tags.indexOf(id) === -1)
    if (missing) return
    if (needle && node.content.toLowerCase().indexOf(needle) === -1) {
      return
    }
    results.push(node._id)
  })
  return results
}

const findResultsByText = (searchText, store) => {
  const results = []
  const needle = searchText.trim().toLowerCase()
  walk(store.db.data, store.state.root, node => {
    if (node.content.toLowerCase().indexOf(needle) !== -1) {
      results.push(node._id)
    }
  })
  return results
}

const findResults = ({tagIds, searchText}, store) => {
  if (tagIds.length) {
    return findResultsForTags(tagIds, searchText, store)
  }
  if (searchText.trim().length) {
    return findResultsByText(searchText, store)
  }
  return []
}

export default class Search extends Component {
  _sub: any
  state: *
  constructor(props: *) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [
        store.events.root(),
        store.events.mode(),
        store.events.activeView(),
        store.events.contextMenu(),
        store.events.viewState(),
      ],
      store => ({
        root: store.getters.root(),
        mode: store.getters.mode(),
        isActiveView: store.getters.isActiveView(),
        contextMenu: store.getters.contextMenu(),
        view: store.getters.viewState(),
        dropping: store.getters.dropping(),
        results: !this.state ||
          (store.getters.root() !== this.state.root ||
            store.getters.viewState() !== this.state.view)
          ? findResults(store.getters.viewState(), store)
          : this.state.results,
      }),
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    const {store} = this.props
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.top)}>
          <Tags
            ids={this.state.view.tagIds}
            tags={store.getters.pluginConfig('tags').tags}
            onAddTag={tag => store.actions.addSearchTag(tag.id)}
          />
          <BouncyInput
            value={this.state.view.searchText}
            onChange={store.actions.setSearchText}
          />
        </div>
        <div className={css(styles.results)}>
          {this.state.results.map(id => (
            <div key={id}>
              <SearchItem id={id} store={store} />
            </div>
          ))}
        </div>
      </div>
    )
  }
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
  },
  results: {},
})
