// @flow
import React, {Component} from 'react';

import type {Store} from 'treed/types'

const withStore = <Props, State>(
  {render, events, state, shouldRefresh, displayName}: {
    render: any,
    events: (store: Store, props: Props) => Array<string>,
    state: (store: Store, props: Props) => State,
    shouldRefresh?: (store: Store, state: State, props?: Props) => boolean,
    displayName: string,
  }
) => class Wrapper extends Component<void, any, any> {
  static displayName = displayName
  _sub: any
  constructor(props: any) {
    super()
    const {store} = props
    // flow :(
    const check = shouldRefresh
    this._sub = store.setupStateListener(
      this,
      store => events(store, props),
      store => state(store, props),
      check ? (store => check(store, this.state, props)) : null,
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
