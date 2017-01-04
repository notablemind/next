// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import {Router, Route, IndexRoute, hashHistory} from 'react-router'

// import Login from './pages/Login'
import Wrapper from './pages/Wrapper'
import Browse from './pages/Browse'
import Settings from './pages/Settings'
import Document from './pages/Document'

export default class App extends Component {
  constructor() {
    super()
  }

  render() {
    return <Router history={hashHistory}>
      <Route path="/" component={Wrapper}>
        <IndexRoute component={Browse}/>
        <Route path="settings" component={Settings} />
        <Route path="doc/:id" component={Document} />
      </Route>
    </Router>
  }
}
