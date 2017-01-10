
const deepMerge = (a, b) => {
  if (!a || !b || Array.isArray(a) || Array.isArray(b) || typeof a !== 'object' || typeof b !== 'object') return b
  const res = {}
  for (let name in b) {
    res[name] = deepMerge(a[name], b[name])
  }
  return res
}

module.exports = deepMerge
