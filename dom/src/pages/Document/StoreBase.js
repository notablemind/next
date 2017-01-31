// Umm not using this atm, might be useful though.
// withStore is the other possibility

class Base<
  Props:Object,
  State,
  DefaultProps: $Shape<Props>
> extends Component<DefaultProps, Props, State> {
  static defaultProps: $Abstract<DefaultProps>
  state: $Abstract<State>
  props: Props
  _sub: any

  static storeEvents: (store: Store, props?: Props) => Array<string>
  static storeState: (store: Store, props?: Props) => State
  static shouldRefreshEvents: ?(store: Store, state: State, props?: Props) => boolean

  constructor({store}: any) {
    super()
    this._sub = store.setupStateListener(
      this,
      store => this.constructor.storeEvents(store, this.props),
      store => this.constructor.storeState(store, this.props),
      this.constructor.shouldRefreshEvents,
    )
  }

  componentDidMount() {
    this._sub.start()
  }

  componentWillUnmount() {
    this._sub.stop()
  }
}


// Example usage
class ViewHeader extends Base {
  state: {root: string, viewType: string}
  static storeEvents = store => [store.events.root(), store.events.viewType()]
  static storeState = store => ({
    root: store.getters.root(),
    viewType: store.getters.viewType(),
  })

  render() {
  }
}
