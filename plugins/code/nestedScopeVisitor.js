
const makePrefix = (scopes, t) => {
  let base = t.identifier(scopes[0])
  scopes.slice(1).forEach(scope => {
    base = t.memberExpression(base, t.identifier(scope))
  })
  return base
}

module.exports = function ({types: t}, scopes, variables) {
  const prefix = makePrefix(scopes, t)
  const scopeVariables = [variables]
  const prefixes = []
  scopes.slice(1).forEach((scope, i) => {
    prefixes.unshift(makePrefix(scopes.slice(0, i + 2), t))
    scopeVariables.unshift(scopeVariables[0][scope] || (scopeVariables[0][scope] = {}))
  })
  return {
    // visitor: {
    Identifier(path) {
      if (!path.isReferencedIdentifier()) {
        if (path.parent.type === 'AssignmentExpression' && path.parent.left === path.node) {
        } else {
        	return
        }
      }
      if (path.scope.getBinding(path.node.name)) {
        return
      }
      for (let i=0; i<scopeVariables.length-1; i++) {
        if (scopeVariables[i][path.node.name]) {
          path.replaceWith(t.memberExpression(prefixes[i], path.node))
          return
        }
      }
    },
    Program(path) {
      path.node.body = [].concat(...path.node.body.map(node => {
        if (node.type === 'VariableDeclaration') {
          const expressions = []
          node.declarations.forEach(child => {
            const binding = path.scope.getBinding(child.id.name)
            const replacement = t.memberExpression(prefix, child.id)
            scopeVariables[0][child.id.name] = true
            if (child.init) {
              expressions.push(t.expressionStatement(t.assignmentExpression('=', replacement, child.init)))
            }
            binding.referencePaths.forEach(path => {
              path.replaceWith(replacement)
            })
            if (node.kind === 'const' && binding.constantViolations.length) {
              throw new Error(`${child.id.name} is constant, illegal reassignment`)
            }
            binding.constantViolations.forEach(path => {
              path.get('left').replaceWith(replacement)
            })
          })
          return expressions
        }
        return [node]
      }))
    }
    // }
  };
}

