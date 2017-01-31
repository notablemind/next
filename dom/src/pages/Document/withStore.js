// @flow
import React, {Component} from 'react';

import type {Store} from 'treed/types'

const withStore = <Props, State>(
  {render, events, state, shouldRefresh}: {
    render: any,
    events: (store: Store, props?: Props) => Array<string>,
    state: (store: Store, props?: Props) => State,
    shouldRefresh?: (store: Store, state: State, props?: Props) => boolean,
  }
) => class Wrapper extends Component<void, any, any> {
  _sub: any
  constructor({store}: any) {
    super()
    // flow :(
    const check = shouldRefresh
    this._sub = store.setupStateListener(
      this,
      store => events(store, this.props),
      store => state(store, this.props),
      check ? (store => check(store, this.state, this.props)) : null,
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    const Component = render
    return <Component {...this.props} {...this.state} />
  }
}

export default withStore
