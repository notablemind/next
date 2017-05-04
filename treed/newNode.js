// @flow

module.exports = (id, parent, now, content = '') => ({
  _id: id,
  created: now,
  modified: now,
  parent,
  children: [],
  type: 'normal',
  content,
  plugins: {},
  types: {},
  views: {},
})
