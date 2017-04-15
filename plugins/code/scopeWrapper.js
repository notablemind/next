
import {parse} from 'babylon'
import * as types from 'babel-types'
import traverse from 'babel-traverse'
import generate from 'babel-generator'
import nestedScopeVisitor from './nestedScopeVisitor'

const SCOPES = '_nm_scopes'

// TODO there's a bug where `globals()` in a nested scope doesn't actually
// persist global stuff, b/c its this fake globals
// the way to fix it would be to have a proxy object that uses __setattr__ and
// just bumps it up to globals every time, but then does __getattr__ with the
// full group? probably
const pythonPrefix = scopes => {
  const lines = [
    `if '${SCOPES}' not in globals(): ${SCOPES} = {}\n`
  ]
  // let prev = ''
  for (let i=1; i<=scopes.length; i++) {
    // const items = scopes.slice(0, i)
    const last = scopes[i - 1]
    // const access = `['${items.join("']['")}']`
    lines.push(`if '${last}' not in ${SCOPES}: ${SCOPES}['${last}'] = {}`)
    // prev = access
  }
  let globals = `globals()`
  if (scopes.length > 1) {
    const globalItems = ['globals()']
    for (let i=0; i<scopes.length-1; i++) {
      globalItems.push(`${SCOPES}['${scopes[i]}']`)
    }
    globals = `dict(${globalItems.map(g => g + '.items()').join(' + ')})`
  }
  return {prefix: lines.join('\n'), globals, locals: `${SCOPES}['${scopes[scopes.length - 1]}']`}
}

const pythonBase = (scopes, text) => {
  const escaped = text.replace("'", "\\'")
  const mode = text.trim().endsWith(';') ? 'exec' : 'single'
  const {prefix, globals, locals} = pythonPrefix(scopes)
  return prefix + `\neval(compile('''${escaped}''', '', '${mode}'), ${globals}, ${locals})\n`
}

const jsPrefix = scopes => {
  const parts = [`if (!window.${SCOPES}) { window.${SCOPES} = {} }`]
  scopes.forEach(scope => {
    parts.push(`if (!window.${SCOPES}.${scope}) { window.${SCOPES}.${scope} = {} }`)
  })
  return parts.join('')
}

const javascriptBase = (scopes, text, variables) => {
  const ast = parse(text, {
    sourceType: 'module',
    plugins: ['jsx', 'flow', 'objectRestSpread', 'classProperties'],
  })
  traverse(ast, nestedScopeVisitor({types}, SCOPES, scopes, variables))
  return jsPrefix(scopes) + generate(ast, {}, text).code
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
