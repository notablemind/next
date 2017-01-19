// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import CatalogViewer from './CatalogViewer'

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
      selectedUri: null,
    }
  }

  componentDidMount() {
    getCatalog().then(catalog => this.setState({catalog}))
  }

  render() {
    if (!this.state.catalog) return <div>Loading...</div>

    return <div className={css(styles.container)}>
      <CatalogViewer catalog={this.state.catalog} />
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'auto',
    width: 300,
  },

})


