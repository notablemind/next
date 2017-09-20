// @flow

import React, {Component} from 'react'
import {css, StyleSheet} from 'aphrodite'
import withStore from './withStore'

const ViewHeader = withStore({
  displayName: 'ViewHeader',
  events: store => [
    store.events.root(),
    store.events.viewType(),
    store.events.defaultView(store.getters.root()),
  ],
  state: store => ({
    root: store.getters.root(),
    viewType: store.getters.viewType(),
    defaultView: store.getters.defaultView(store.getters.root()),
  }),
  shouldRefresh: (store, state) => state.root !== store.getters.root(),
  render: ({
    store,
    root,
    viewType,
    viewTypes,
    defaultView: {viewType: defaultViewType = 'list', ...rest} = {},
  }) => (
    <div className={css(styles.container)}>

      <div className={css(styles.buttons)}>
        {viewType !== defaultViewType && viewType !== 'search' && viewType !== 'trash' &&
          <button
            className={css(styles.setDefaultButton)}
            onClick={() => store.actions.setDefaultView({viewType, ...rest})}
          >
            Set default
          </button>}
        {Object.keys(viewTypes).map(key => (
          <button
            className={css(
              styles.typeButton,
              key === viewType && styles.typeButtonSelected,
            )}
            key={key}
            onClick={
              key === viewType ? null : () => store.actions.changeViewType(key)
            }
          >
            {viewTypes[key].title}
          </button>
        ))}
      </div>
    </div>
  ),
})

export default ViewHeader

const button = {
  cursor: 'pointer',
  backgroundColor: 'white',
  border: 'none',
  margin: '0 4px',
  borderRadius: 4,
  color: '#999',
  ':hover': {
    backgroundColor: '#eee',
  },
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 5,
  },

  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeButton: {
    ...button,
  },

  setDefaultButton: {
    ...button,
  },

  typeButtonSelected: {
    backgroundColor: '#eee',
  },
})
