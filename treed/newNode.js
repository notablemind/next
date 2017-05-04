// @flow

module.exports = (
  id /*: string*/,
  parent /*: ?string*/,
  now /*: number*/,
  content /*: string*/ = '',
) => ({
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
