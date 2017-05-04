module.exports = (id, filename, data) => {
  if (!data.docs || !Array.isArray(data.docs)) return
  const meta = {
    id: id,
    title: 'Something',
    lastOpened: Date.now(),
    lastModified: Date.now(),
    created: Date.now(),
    size: data.docs.length - 1,
    sync: null
  }
  return {meta, docs: data.docs}
}
