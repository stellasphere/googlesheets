const GoogleSheets = require("./index.js")
var sheet = new GoogleSheets("1pf5dycTFgVXlG5wUXFHvzW0B_zCJDNRvs9BwdIlw5jA",{
  debug: false
})

init()

async function init() {
  console.log("test")
  
  await sheet.authViaAPIKey(process.env.GOOGLE_API_KEY)

  var index = await sheet.index("projects")
  console.log("Index:",index)
  console.log(index["Voice Transcriber"].links)
}