
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

const threshhold = 20

export default class Slider extends Component {
  constructor(props) {
    super()
    this.lastPosition = null
    this.direction = null
    this.state = {
      slideState: null,
    }
    this.offset = 0
    this.firstTouch = true
    this.firstTouchGood = false

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
      this.firstTouch = true
      this.firstTouchGood = false
    }

    this._panGesture = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (this.firstTouch) {
          this.firstTouchGood = evt.nativeEvent.pageX > threshhold
          this.firstTouch = false
        }
        if (!this.firstTouchGood) {
          clearTimeout(this._resetTimeout)
          this._resetTimeout = setTimeout(() => this.firstTouch = true, 500)
        }
        const isHoriz = Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        if (!isHoriz) return false
        return Math.abs(gestureState.dx) > threshhold
      },
      onPanResponderGrant: (evt, gestureState) => {
        this.position = 0
        this.lastPosition = null
      },
      onPanResponderMove: (evt, gestureState) => {
        if (this.lastPosition === null) {
          this.lastPosition = gestureState.dx
          if (this.state.slideState) {
            this.offset = gestureState.dx > 0 ? -screenWidth : screenWidth
          }
          this.direction = this.state.slideState ? null :
            (gestureState.dx > 0 ? 'right' : 'left')
        } else {
          const diff = gestureState.dx - this.lastPosition
          switch (this.offset) {
            case 0:
              this.direction =
                gestureState.dx > 0 ?
                  (diff > 0 ? 'right' : null) :
                  (diff > 0 ? null : 'left')
              break
            case -screenWidth:
              this.direction = diff > 0 ? null : 'left'
              break
            default:
            case screenWidth:
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

  slideClosed = () => {
    this.direction = null
    this.moveFinished()
  }

  render() {
    return <View style={this.props.style}
        {...this._panGesture.panHandlers}
    >
      <View
        style={styles.backdrop}
      >
        {React.cloneElement(this.props.backdrop, {
          slideClosed: this.slideClosed,
        })}
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
