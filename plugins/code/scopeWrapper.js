
import {parse} from 'babylon'
import * as types from 'babel-types'
import traverse from 'babel-traverse'
import generate from 'babel-generator'
import nestedScopeVisitor from './nestedScopeVisitor'

const SCOPES = '_nm_scopes'

// TODO maybe use defaultdicts? But then I'd have to import...
const pythonPrefix = scopes => {
  const lines = [
    `if '${SCOPES}' not in locals(): ${SCOPES} = {}\n`
  ]
  let prev = ''
  for (let i=1; i<=scopes.length; i++) {
    const items = scopes.slice(0, i)
    const last = scopes[i - 1]
    const access = `['${items.join("']['")}']`
    lines.push(`if '${last}' not in ${SCOPES}${prev}: ${SCOPES}${access} = {}`)
    prev = access
  }
  let globals = `globals()`
  if (scopes.length > 1) {
    const globalItems = ['globals()']
    for (let i=1; i<scopes.length; i++) {
      const items = scopes.slice(0, i)
      globalItems.push(`${SCOPES}['${items.join("']['")}']`)
    }
    globals = `dict(${globalItems.map(g => g + '.items()').join(' + ')})`
  }
  return {prefix: lines.join('\n'), globals, locals: `${SCOPES}${prev}`}
}

const pythonBase = (scopes, text) => {
  const escaped = text.replace("'", "\\'")
  const mode = text.trim().endsWith(';') ? 'exec' : 'single'
  const {prefix, globals, locals} = pythonPrefix(scopes)
  return prefix + `\neval(compile('''${escaped}''', '', '${mode}'), ${globals}, ${locals})\n`
}

const jsPrefix = scopes => {
  const parts = []
  for (let i=1; i<=scopes.length; i++) {
    const pref = scopes.slice(0, i).join('.')
    parts.push(`if (!window.${pref}) { window.${pref} = {} }`)
  }
  return parts.join('')
}

const javascriptBase = (scopes, text, variables) => {
  const ast = parse(text, {
    sourceType: 'module',
    plugins: ['jsx', 'flow', 'objectRestSpread', 'classProperties'],
  })
  const allScopes = [SCOPES].concat(scopes)
  traverse(ast, nestedScopeVisitor({types}, allScopes, variables))
  return jsPrefix(allScopes) + generate(ast, {}, text).code
}

const wrappers = {
  python: (text, scopes, variables) => {
    if (!scopes.length) return text
    const res = pythonBase(scopes, text)
console.log(res)
return res
  },
  javascript: (text, scopes, variables) => {
    const res = javascriptBase(scopes, text, variables)
    // we mutate `variables`
    return res
  }
}

export default wrappers
