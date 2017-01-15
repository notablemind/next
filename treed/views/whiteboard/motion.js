// @flow

export const up = (topLevels: Array<string>, nodeMap: {[key: string]: any}, active: string) => {
  const mine = nodeMap[active].getBoundingClientRect()
  let best = null
  let bestId = null
  for (let id of topLevels) {
    if (id === active) continue
    const box = nodeMap[id].getBoundingClientRect()
    if (box.bottom < mine.top
        && (
          (mine.left <= box.left && box.left <= mine.right) ||
          (box.left <= mine.left && mine.left <= box.right)
        )
        && (!best || box.bottom > best)) {
      best = box.bottom
      bestId = id
    }
  }

  return bestId
}

export const down = (topLevels: Array<string>, nodeMap: {[key: string]: any}, active: string) => {
  const mine = nodeMap[active].getBoundingClientRect()
  let best = null
  let bestId = null
  for (let id of topLevels) {
    if (id === active) continue
    const box = nodeMap[id].getBoundingClientRect()
    if (box.top > mine.bottom
        && (
          (mine.left <= box.left && box.left <= mine.right) ||
          (box.left <= mine.left && mine.left <= box.right)
        )
        && (!best || box.top < best)) {
      best = box.top
      bestId = id
    }
  }

  return bestId
}

export const left = (topLevels: Array<string>, nodeMap: {[key: string]: any}, active: string) => {
  const mine = nodeMap[active].getBoundingClientRect()
  let best = null
  let bestId = null
  for (let id of topLevels) {
    if (id === active) continue
    const box = nodeMap[id].getBoundingClientRect()
    if (box.right < mine.left
        && (
          (mine.top <= box.top && box.top <= mine.bottom) ||
          (box.top <= mine.top && mine.top <= box.bottom)
        )
        && (!best || box.right > best)) {
      best = box.right
      bestId = id
    }
  }

  return bestId
}


export const right = (topLevels: Array<string>, nodeMap: {[key: string]: any}, active: string) => {
  const mine = nodeMap[active].getBoundingClientRect()
  let best = null
  let bestId = null
  for (let id of topLevels) {
    if (id === active) continue
    const box = nodeMap[id].getBoundingClientRect()
    if (box.left > mine.right
        && (
          (mine.top <= box.top && box.top <= mine.bottom) ||
          (box.top <= mine.top && mine.top <= box.bottom)
        )
        && (!best || box.left < best)) {
      best = box.left
      bestId = id
    }
  }

  return bestId
}

