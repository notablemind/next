import keys from '../list/keys'

const myKeys = {...keys}
const exclude = ['rebase', 'rebaseUp', 'rebaseNext', 'rebasePrev', 'rebaseRoot']
exclude.forEach(k => {
  delete myKeys[k]
})
export default myKeys
