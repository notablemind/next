const rand = () => Math.random().toString(16).slice(2)

module.exports = () => {
  return rand() + rand()
}
