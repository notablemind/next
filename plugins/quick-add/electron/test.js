
const {app} = require('electron')

app.on('ready', () => {

const plugin = require('./')
plugin._openWindow({
  meta: {
  }
})

})
