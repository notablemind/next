// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'

import {Router, Route, IndexRoute, hashHistory} from 'react-router'

// import * as googleApi from './pages/Wrapper/googleApi'

// import Login from './pages/Login'
// import Wrapper from './pages/Wrapper'
// import Browse from './pages/Browse'
import Document from './pages/Document'

const NotableMind = ELECTRON
  ? require('../../electron/src/NotableClient.js').default
  : require('../../electron/src/NotableLocal.js').default

export default class App extends Component {
  nm: any
  state: {
    toast: Array<{type: 'error', message: string}>,
    loading: boolean,
  }

  constructor() {
    super()
    this.state = {
      toast: [],
      loading: true,
    }
    this.nm = new NotableMind(this.showToast)
  }

  showToast = (config: any) => {
    console.log('toasty', config)
  }

  componentWillMount() {
    this.nm.init().then(() => this.setState({loading: false}))
  }

  render() {
    if (this.state.loading) {
      return <Loading />
    }

    return (
      <Router history={hashHistory}>
        <Route path="/">
          <IndexRoute
            component={props => <Document {...props} nm={this.nm} />}
          />
          <Route
            path="doc/:id"
            component={props => <Document {...props} nm={this.nm} />}
          />
          <Route
            path="doc/:id/:root"
            component={props => <Document {...props} nm={this.nm} />}
          />
        </Route>
      </Router>
    )
  }
}

const Loading = () => (
  <div style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontSize: 30, color: '#aaa'}}>Loading</div>
  </div>
)
