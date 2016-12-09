// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import Popup from '../../components/Popup'
import LoginForm from './LoginForm'

const LoginStatus = ({user, loading, online, loginError, onLogin, onLogout}) => {
  if (user) {
    return <Popup key="logged-in">
      {(isOpen, setOpen, ref) =>
        <div className={css(styles.container)} ref={ref}>
          <div
            onClick={() => setOpen()}
            className={css(styles.email, !online && styles.offline)}
          >
            {user.metadata.email}
          </div>
          {isOpen && <div className={css(styles.profile)}>
            <button onClick={onLogout}>
              Logout
            </button>
          </div>}
        </div>}
    </Popup>
  }

  if (loading) {
    return <div className={css(styles.container)}>
      Loading...
    </div>
  }

  return <Popup key="logged-out">
  {(isOpen, setOpen, ref) =>
    <div className={css(styles.container)} ref={ref}>
      <div className={css(styles.loginToSync)} onClick={() => setOpen()}>
        Login to sync
      </div>
      {isOpen &&
        <div className={css(styles.loginForm)}>
          <LoginForm
            onLogin={onLogin}
            loginError={loginError}
            loading={loading}
          />
        </div>}
    </div>}
  </Popup>
}

export default LoginStatus

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  email: {
    cursor: 'pointer',
  },

  loginToSync: {
    cursor: 'pointer',
  },

  profile: {
    position: 'absolute',
    top: '100%',
    backgroundColor: 'white',
    boxShadow: '0 0 3px #ccc',
    marginTop: 10,
    padding: 10,
    right: 10,
  },

  loginForm: {
    backgroundColor: 'white',
    position: 'absolute',
    boxShadow: '0 0 3px #ccc',
    top: '100%',
    padding: 20,
    marginTop: 10,
    right: 10,
  },

  offline: {
    color: '#999',
  },
})
