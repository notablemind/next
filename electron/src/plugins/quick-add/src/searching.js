import type {Result} from './Searcher'

export const searchDocs = (docs, text): Array<Result> => {
  if (!text) return docs.sort((a, b) => b.lastModified - a.lastModified)
  text = text.toLowerCase()
  return docs
    .filter(d => d.title.toLowerCase().indexOf(text) !== -1)
    // TODO fuzzy search
    .sort((a, b) => b.lastModified - a.lastModified)
    .map(doc => ({title: doc.title, id: doc.id, root: 'root', subtitle: null, type: ':doc:'}))
}

export const debounce = <T>(fn: (a: T) => void, time): (a: T) => void => {
  let tout = null
  return (arg: T) => {
    clearTimeout(tout)
    tout = setTimeout(() => fn(arg), time)
  }
}

