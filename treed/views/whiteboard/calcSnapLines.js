const addMaybe = (map, ar, n) => {
  if (map[n]) return
  ar.push(n)
  map[n] = true
}

const calcSnapLines = (myIds, topLevelIds, nodeMap, x, y, box) => {
  const dx = x - box.left
  const dy = y - box.top
  const lefts = []
  const ls = {}
  const rights = []
  const rs = {}
  const tops = []
  const ts = {}
  const bottoms = []
  const bs = {}

  topLevelIds.forEach(id => {
    if (myIds[id]) return
    const box = nodeMap[id].getBoundingClientRect()
    addMaybe(ls, lefts, box.left + dx)
    addMaybe(rs, rights, box.right + dx)
    addMaybe(ts, tops, box.top + dy)
    addMaybe(bs, bottoms, box.bottom + dy)
    // TODO maybe have a fuzzy check instead?
  })

  lefts.sort()
  rights.sort()
  bottoms.sort()
  tops.sort()
  return {lefts, rights, tops, bottoms}
}

export default calcSnapLines
