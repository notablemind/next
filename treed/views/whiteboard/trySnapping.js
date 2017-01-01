
const snapMargin = 10

const snapPadding = 5

const compare = (mine, anchor) => mine - snapMargin < anchor && mine + snapMargin > anchor

const trySnapping = (x, y, width, height, {lefts, rights, tops, bottoms}) => {
  let xsnap = false
  for (let i=0; i < lefts.length; i++) {
    if (compare(x, lefts[i])) {
      x = lefts[i]
      xsnap = true
      break
    }

    if (compare(x + width, lefts[i] - snapPadding)) {
      x = lefts[i] - snapPadding - width
      xsnap = true
      break
    }
  }

  if (!xsnap) {
    for (let i=0; i < rights.length; i++) {
      if (compare(x, rights[i] + snapPadding)) {
      // if (rights[i] + snapPadding > x - snapMargin && rights[i] + snapPadding < x + snapMargin) {
        x = rights[i] + snapPadding
        break
      }

      if (compare(rights[i], x + width)) {
      // if (rights[i] - snapPadding > x + width - snapMargin && rights[i] - snapPadding < x + width + snapMargin) {
        x = rights[i] - width
        break
      }
    }
  }

  let ysnap = false
  for (let i=0; i < tops.length; i++) {
    if (compare(y, tops[i])) {
    // if (tops[i] > y - snapMargin && tops[i] < y + snapMargin) {
      y = tops[i]
      ysnap = true
      break
    }

    if (compare(y + height, tops[i] - snapPadding)) {
    // if (tops[i] - snapPadding > y + height - snapMargin && tops[i] - snapPadding < y + height + snapMargin) {
      y = tops[i] - snapPadding - height
      ysnap = true
      break
    }
  }

  if (!ysnap) {
    for (let i=0; i < bottoms.length; i++) {
      if (compare(y, bottoms[i] + snapPadding)) {
      // if (bottoms[i] + snapPadding > y - snapMargin && bottoms[i] + snapPadding < y + snapMargin) {
        y = bottoms[i] + snapPadding
        break
      }

      if (compare(y + height, bottoms[i])) {
      // if (bottoms[i] - snapPadding > y + height - snapMargin && bottoms[i] - snapPadding < y + height + snapMargin) {
        y = bottoms[i] - height
        break
      }
    }
  }

  return {x, y}
}

export default trySnapping
