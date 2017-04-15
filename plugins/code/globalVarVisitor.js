
module.exports = function ({types: t}) {
  return {
    Program(path) {
      path.node.body.forEach(node => {
        if (node.type !== 'VariableDeclaration') return
        if (node.kind === 'const') {
          node.declarations.forEach(child => {
            const binding = path.scope.getBinding(child.id.name)
            if (binding.constantViolations.length) {
              throw new Error(`${child.id.name} is constant, illegal reassignment`)
            }
          })
        }
        node.kind = 'var'
      })
    }
  };
}

