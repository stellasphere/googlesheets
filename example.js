const GoogleSheets = require("./index.js")
var sheet = new GoogleSheets("1x268zkmymCjNm_iUwBM4v4EQCjT0H5IwcVAB-rfZ9x8",{
  debug: true
})

console.log("test0")
init()

async function init() {
  console.log("test")
  
  await sheet.authViaAPIKey(process.env.GOOGLE_API_KEY)

  
  var index = await sheet.index("sheet")
  console.log(index)
}