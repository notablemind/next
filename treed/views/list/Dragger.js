const pixeled = {top: 1, left: 1, width: 1, height: 1}

const extend = (a, b) => {
  for (let name in b) {
    a[name] = b[name] + (pixeled[name] ? 'px' : '')
  }
}

export default class Dragger {
  constructor(measurements, canOver) {
    this.canOver = canOver
    this.measurements = measurements
    this.indicator = document.createElement('div')
    this.current = null
    document.body.appendChild(this.indicator)
    extend(this.indicator.style, {
      backgroundColor: 'black',
      position: 'absolute',
      opacity: 0.1,
      pointerEvents: 'none',
    })

    this.measure = canOver
      ? top => {
          for (let i = 0; i < this.measurements.length; i++) {
            if (this.measurements[i][1].bottom <= top) continue
            const box = this.measurements[i][1]
            if (top - box.top < 5 && i > 0) {
              this.showBefore(i, box.top, box.left, box.width)
            } else if (top < box.bottom - 5) {
              this.showOver(i, box)
            } else if (!this.measurements[i][2]) {
              // TODO disallow the "after" for things w/ open children
              this.showAfter(i, box.bottom, box.left, box.width)
            } else {
              continue
            }
            return
          }
          const i = this.measurements.length - 1
          const box = this.measurements[i][1]
          this.showAfter(i, box.bottom, box.left, box.width)
        }
      : top => {
          for (let i = 0; i < this.measurements.length; i++) {
            if (this.measurements[i][1].bottom <= top) continue
            const box = this.measurements[i][1]
            if (top < box.top + box.height / 2 && i > 0) {
              this.showBefore(i, box.top, box.left, box.width)
            } else if (!this.measurements[i][2]) {
              this.showAfter(i, box.bottom, box.left, box.width)
            } else {
              continue
            }
            return
          }
          const i = this.measurements.length - 1
          const box = this.measurements[i][1]
          this.showAfter(i, box.bottom, box.left, box.width)
        }
  }

  showBefore(index, top, left, width) {
    this.current = {index, at: 'before'}
    extend(this.indicator.style, {
      top: top - 5,
      left: left,
      height: 10,
      width: width,
    })
  }

  showAfter(index, top, left, width) {
    this.current = {index, at: 'after'}
    extend(this.indicator.style, {
      top: top - 5,
      left: left,
      height: 10,
      width: width,
    })
  }

  showOver(index, box) {
    this.current = {index, at: 'over'}
    extend(this.indicator.style, {
      top: box.top,
      left: box.left,
      height: box.height,
      width: box.width,
    })
  }

  onMove = e => {
    e.preventDefault()
    e.stopPropagation()
    const top = e.clientY
    this.measure(top)
    // TODO hang on to the currentIndex
  }

  getCurrent() {
    return {
      id: this.measurements[this.current.index][0],
      at: this.current.at,
    }
  }

  destroy() {
    this.indicator.parentNode.removeChild(this.indicator)
    this.indicator = null
  }
}
