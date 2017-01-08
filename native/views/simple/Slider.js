
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  Linking,
  ScrollView,
  TouchableOpacity,
  Image,
  PanResponder,
  Dimensions,
  LayoutAnimation,
} from 'react-native';

const screenWidth = Dimensions.get('window').width

const queueAnimation = () => {
  LayoutAnimation.configureNext({
    duration: 100,
    create: {
      type: LayoutAnimation.Types.linear,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.linear,
      springDamping: 0.7,
    },
  });
}

export default class Slider extends Component {
  constructor(props) {
    super()
    this.lastPosition = null
    this.direction = null
    this.state = {
      slideState: null,
    }
    this.offset = 0

    this.moveFinished = () => {
      if (this.direction === 'right') {
        this.offset = screenWidth
      } else if (this.direction === 'left') {
        this.offset = -screenWidth
      } else {
        this.offset = 0
      }
      this.setState({slideState: this.direction})
      queueAnimation()
      this.main.setNativeProps({style: {left: this.offset}})
    }

    this._panGesture = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isHoriz = Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        if (!isHoriz) return false
        const slid = this.state.slideState !== null
        switch (this.state.slideState) {
          case null:
            return Math.abs(gestureState.dx) > 20
          case 'left':
            return gestureState.dx > 20
          case 'right':
          default:
            return gestureState.dx < -20
        }
      },
      onPanResponderGrant: (evt, gestureState) => {
        this.position = 0
        this.lastPosition = null
      },
      onPanResponderMove: (evt, gestureState) => {
        if (this.lastPosition === null) {
          this.lastPosition = gestureState.dx
          this.direction = this.state.slideState ? null :
            (gestureState.dx > 0 ? 'right' : 'left')
        } else {
          const diff = gestureState.dx - this.lastPosition
          switch (this.state.slideState) {
            case null:
              this.direction =
                gestureState.dx > 0 ?
                  (diff > 0 ? 'right' : null) :
                  (diff > 0 ? null : 'left')
              break
            case 'left':
              this.direction = diff > 0 ? null : 'left'
              break
            default:
            case 'right':
              this.direction = diff > 0 ? 'right' : null
              break
          }
          this.lastPosition = gestureState.dx
        }
        // TODO maybe bidirectional?
        this.main.setNativeProps({
          style: {
            left: // Math.min(
              this.offset + gestureState.dx,
              // screenWidth,
            // )
          },
        })
      },
      onPanResponderRelease: this.moveFinished,
      onPanResponderTerminate: this.moveFinished,
    })
  }

  render() {
    return <View style={this.props.style}
        {...this._panGesture.panHandlers}
    >
      <View
        style={styles.backdrop}
      >
        {this.props.backdrop}
      </View>
      <View
        ref={node => this.main = node}
        style={[styles.main, {
          left: this.offset,
        }]}
      >
        {this.props.main}
      </View>
    </View>
  }
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  main: {
    // flex: 1,
    // alignSelf: 'stretch',
  },
})
