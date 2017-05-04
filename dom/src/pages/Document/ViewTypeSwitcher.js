import React, {Component} from 'react'

const withCurrentStore = (Child, loading) =>
  class WithCurrentStore extends Component {
    constructor(props) {
      super()
      this._sub = props.globalStore.setupStateListener(
        this,
        store => [store.events.activeView()],
        store => ({store: store.activeView()}),
      )
    }

    componentDidMount() {
      this._sub.start()
    }

    componentWillUnmount() {
      this._sub.stop()
    }

    render() {
      if (this.state.store)
        return <Child {...this.props} store={this.state.store} />
      return loading
    }
  }

class ViewTypeSwitcher extends Component {
  constructor(props) {
    super()
    this._sub = props.store.setupStateListener(
      this,
      store => [store.events.settingsChanged(), store.events.root()],
      store => {
        return {
          root: store.getters.root(),
          defaultView: store.getters.defaultView(store.getters.root()) ||
            store.getters.defaultView('root'),
        }
      },
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }

  render() {
    return (
      <div>
        {this.state.defaultView.type}
      </div>
    )
  }
}

export default withCurrentStore(ViewTypeSwitcher, null)
