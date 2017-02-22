
const raw = "a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928"
const items = []
for (let i=0; i<raw.length; i+=6) {
  items.push('#' + raw.slice(i, i + 6))
}
export default items
