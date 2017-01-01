// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import WhiteboardRoot from './WhiteboardRoot'
import Dragger from './Dragger'

type Props = {
  store: any,
}
type State = {
  x: number,
  y: number,
  zoom: number,
}

export default class Whiteboard extends Component {
  props: Props
  state: State
  constructor(props: Props) {
    super()
    this.state = {
      x: 0,
      y: 0,
      zoom: 1,
    }
  }

  onDragDone() {
    // TODO maybe save it or something?
  }

  render() {
    const {x, y, zoom} = this.state
    // TODO zoom?
    return <div className={css(styles.container)}>
      <Dragger
        onDrag={(x, y) => this.setState({x, y})}
        x={x}
        y={y}
        onDone={this.onDragDone}
      />
      <div className={css(styles.status)}>
        {x}:{y}:: {zoom}
      </div>
      <div
        className={css(styles.offset)}
        style={{
          transform: `translate(${x}px, ${y}px)`,
        }}
      >
        <WhiteboardRoot
          store={this.props.store}
        />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    position: 'relative',
  },

  offset: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  status: {
    position: 'absolute',
  },

})

