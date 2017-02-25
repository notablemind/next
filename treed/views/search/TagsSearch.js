
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

import TagInput from '../../../plugins/tags/TagInput'
import Icon from '../utils/Icon'

const Tags = ({ids, tags, onAddTag}) => {
  return <div className={css(styles.tags)} onMouseDown={e => e.stopPropagation()}>
    {ids.map(id => (
      <div
        key={id}
        style={{backgroundColor: tags[id].color}}
        onClick={() => store.emitIntent('filter-by-tag', id)} // TODO
        className={css(styles.tag)}
      >
        {tags[id].label}
          <Icon
            onMouseDown={e => (e.preventDefault(), store.actions.removeTag(id))}
            className={css(styles.deleteIcon)}
            name="ios-close-empty"
          />
      </div>
    ))}
    <TagInput
      tags={Object.keys(tags).map(id => tags[id])}
      onNormalMode={() => {}}
      onAddTag={onAddTag}
      ids={ids}
    />
  </div>
}

export default Tags

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 3,
  },

  deleteIcon: {
    padding: 2,
    marginLeft: 2,
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: 'white',
      color: 'black',
    },
  },

  tag: {
    flexDirection: 'row',
    padding: '2px 5px',
    margin: 1,
    borderRadius: 2,
    fontSize: 10,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#eee',
    },
  },
})


