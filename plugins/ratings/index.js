// @flow

import type {Plugin} from 'treed/types'
import React from 'react'
import {css, StyleSheet} from 'aphrodite'
import Icon from 'treed/views/utils/Icon'
import Content from 'treed/views/body/Content'

import Rater from './Rater'

const PLUGIN_ID = 'ratings'

const plugin: Plugin<void, void> = {
  id: PLUGIN_ID,

  actions: {
    setRating(store, rating: number) {
      const node = store.getters.activeNode()
      if (node.type !== 'rating5') return
      store.actions.setNested(node._id, ['types', 'rating5', 'value'], rating)
    },
  },

  nodeTypes: {

    rating5: {
      title: 'Rating 1-5',
      newSiblingsShouldCarryType: true,
      shortcut: 'r',

      actions: {
        rate1: {
          shortcuts: {
            normal: 'r 1',
          },
          description: 'Rate 1',
          action: store => store.actions.setRating(1)
        },
        rate2: {
          shortcuts: {
            normal: 'r 2',
          },
          description: 'Rate 2',
          action: store => store.actions.setRating(2)
        },
        rate3: {
          shortcuts: {
            normal: 'r 3',
          },
          description: 'Rate 3',
          action: store => store.actions.setRating(3)
        },
        rate4: {
          shortcuts: {
            normal: 'r 4',
          },
          description: 'Rate 4',
          action: store => store.actions.setRating(4)
        },
        rate5: {
          shortcuts: {
            normal: 'r 5',
          },
          description: 'Rate 5',
          action: store => store.actions.setRating(5)
        },
        rateClear: {
          shortcuts: {
            normal: 'r 0',
          },
          description: 'Clear rating',
          action: store => store.actions.setRating(null)
        },
      },

      render: props => {
        return <div className={css(styles.ratingBody)}>
          <Rater
            value={(props.node.types.rating5 || {}).value}
            onChange={value => props.store.actions.setNested(
              props.node._id,
              ['types', 'rating5', 'value'],
              value
            )}
          />
          <Content {...props} style={{flex: 1}}/>
        </div>
      }, // TODO make this too
    },
  },

}

export default plugin

const styles = StyleSheet.create({
  ratingBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
})
