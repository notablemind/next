// @flow

import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'
import withStore from './withStore'

const ViewHeader = withStore({
  displayName: 'ViewHeader',
  events: store => [store.events.root(), store.events.viewType(), store.events.defaultView(store.getters.root())],
  state: store => ({
    root: store.getters.root(),
    viewType: store.getters.viewType(),
    defaultView: store.getters.defaultView(store.getters.root()),
  }),
  shouldRefresh: (store, state) => state.root !== store.getters.root(),
  render: ({store, root, viewType, viewTypes,
            defaultView: {viewType: defaultViewType, ...rest}={}}) => (
    <div className={css(styles.container)}>

      <div className={css(styles.buttons)}>
        {Object.keys(viewTypes).map(key => (
          <button
            className={css(styles.typeButton, key === viewType && styles.typeButtonSelected)}
            key={key}
            onClick={key === viewType ? null :
              () => store.actions.changeViewType(key)}
          >
            {viewTypes[key].title}
          </button>
        ))}
        {viewType !== defaultViewType &&
          <button
            onClick={() => store.actions.setDefaultView({viewType, ...rest})}
          >
            Set default
          </button>
        }
      </div>
    </div>
  )
})

export default ViewHeader

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeButton: {
    cursor: 'pointer',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    margin: '0 4px',
    borderRadius: 4,
  },

  typeButtonSelected: {
    backgroundColor: '#eee',
  },
})

