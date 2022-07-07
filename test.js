const GoogleSheets = require("./index.js")

var sheet = new GoogleSheets("1pf5dycTFgVXlG5wUXFHvzW0B_zCJDNRvs9BwdIlw5jA",{
  debug:true
})

init()
async function init() {
  await sheet.authViaAPIKey(process.env.GOOGLE_API_KEY)

  var list = await sheet.list("Project List")
  //console.log(list)
}