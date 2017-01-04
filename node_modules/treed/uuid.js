
const rand = () => Math.random().toString(16).slice(2)

export default () => {
  return rand() + rand()
}

