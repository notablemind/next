
import {parse} from 'babylon'
import * as types from 'babel-types'
import traverse from 'babel-traverse'
import generate from 'babel-generator'
import globalVarVisitor from './globalVarVisitor'

export default (text) => {
  const ast = parse(text, {
    sourceType: 'module',
    plugins: ['jsx', 'flow', 'objectRestSpread', 'classProperties'],
  })
  traverse(ast, globalVarVisitor({types}))
  return generate(ast, {}, text).code
}

