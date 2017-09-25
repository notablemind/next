
import React, {Component} from 'react'
import Presenter from './Presenter'
// import SlideList from './SlideList'

export default class Presentation extends Component {
  state = {
    presenting: true
  }

  render() {
    if (this.state.presenting) {
      return <Presenter
        store={this.props.store}
      />
    } else {
      return <span>lol</span>
      // return <SlideList store={this.props.store} />
    }
  }
}

