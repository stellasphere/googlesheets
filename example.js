const GoogleSheets = require("./index.js")
var sheet = new GoogleSheets("1x268zkmymCjNm_iUwBM4v4EQCjT0H5IwcVAB-rfZ9x8",{
  debug: false
})

init()

async function init() {
  console.log("test")
  
  await sheet.authViaAPIKey(process.env.GOOGLE_API_KEY)

  
  // var list = await sheet.list("sheet_childattributes",true)
  // console.log("List:",list)  
  var index = await sheet.index("sheet_childattributes")
  console.log("Index:",index)

  var list = await sheet.list("sheet_multicolumn_array")
  console.log("List:",list)
}