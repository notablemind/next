
const snapMargin = 10

const snapPadding = 5

const compare = (mine, anchor) => mine - snapMargin < anchor && mine + snapMargin > anchor

const trySnapping = (x, y, width, height, {lefts, rights, tops, bottoms}) => {
  let xsnap = null
  for (let i=0; i < lefts.length; i++) {
    if (compare(x, lefts[i])) {
      x = lefts[i]
      xsnap = lefts[i] - snapPadding
      break
    }

    if (compare(x + width, lefts[i] - snapPadding)) {
      x = lefts[i] - snapPadding - width
      xsnap = lefts[i] - snapPadding
      break
    }
  }

  if (xsnap === null) {
    for (let i=0; i < rights.length; i++) {
      if (compare(x, rights[i] + snapPadding)) {
        x = rights[i] + snapPadding
        xsnap = rights[i]
        break
      }

      if (compare(rights[i], x + width)) {
        x = rights[i] - width
        xsnap = rights[i]
        break
      }
    }
  }

  let ysnap = null
  for (let i=0; i < tops.length; i++) {
    if (compare(y, tops[i])) {
      y = tops[i]
      ysnap = tops[i] - snapPadding
      break
    }

    if (compare(y + height, tops[i] - snapPadding)) {
      y = tops[i] - snapPadding - height
      ysnap = tops[i] - snapPadding
      break
    }
  }

  if (ysnap === null) {
    for (let i=0; i < bottoms.length; i++) {
      if (compare(y, bottoms[i] + snapPadding)) {
        y = bottoms[i] + snapPadding
        ysnap = bottoms[i]
        break
      }

      if (compare(y + height, bottoms[i])) {
        y = bottoms[i] - height
        ysnap = bottoms[i]
        break
      }
    }
  }

  return {x, y, xsnap, ysnap}
}

export default trySnapping
