// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Popup from '../../components/Popup'
import LoginStatus from './LoginStatus'

export default class Header extends Component {
  render() {
    return <div className={css(styles.container)}>
      <div style={{flex: 1}} />
      <div className={css(styles.title)}>
        {this.props.title}
      </div>
      <div style={{flex: 1, alignItems: 'flex-end'}}>
      <LoginStatus
        {...this.props}
      />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: '10px 20px',
  },

  title: {
    alignItems: 'center',
  },
})
