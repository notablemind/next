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

export default class ScripturePane extends Component {
  state: any
  constructor({store}: any) {
    super()
    this.state = {
      catalog: null,
      selectedItem: null,
      subitem: null,
    }
  }

  componentDidMount() {
    getCatalog().then(catalog => this.setState({catalog}))
  }

  onSelect = item => {
    getItem(item._id).then(data => this.setState({
      selectedItem: {
        ...item,
        children: Object.keys(data.items)
          .map(id => data.items[id])
          .sort((a, b) => a.position - b.position),
      }
    }))
  }

  onSelectUri = item => {
    getSubitem(this.state.selectedItem._id, item.uri).then(content => this.setState({
      subitem: {
        ...item,
        content,
      },
    }))
  }

  render() {
    if (!this.state.catalog) return <div>Loading...</div>

    if (!this.state.selectedItem) {
      return <div className={css(styles.container)}>
        <CatalogViewer
          catalog={this.state.catalog}
          onSelect={this.onSelect}
        />
      </div>
    }

    if (this.state.subitem) {
      return <ContentViewer
        item={this.state.subitem}
        // title={this.state.selectedItem.title}
        onBack={() => this.setState({subitem: null})}
      />
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
      {this.state.selectedItem.children.map(item => (
        <div
          key={item._id}
          className={css(styles.item)}
          dangerouslySetInnerHTML={{__html: item.title_html}}
          onClick={() => this.onSelectUri(item)}
        />
      ))}
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'auto',
    width: 300,
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

})


