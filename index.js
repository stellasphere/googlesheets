const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

module.exports = class GoogleSheets {
  constructor(sheetid,debug) {
    this.docid = sheetid
    this.authenticated = false
    this.doc = new GoogleSpreadsheet(sheetid)
    this.debug = debug
  }
   async authViaServiceAccount(clientemail,privatekey) {
    await this.doc.useServiceAccountAuth({
      client_email: clientemail,
      private_key: privatekey
    })
    
    await this.authComplete()
  }
   async authViaServiceAccountFile(path) {
    var file = await fs.promises.readFile(path)
    var filejson = JSON.parse(file)
    await this.authViaServiceAccount(filejson.client_email,filejson.private_key)
    
    await this.authComplete()
  }
  async authViaAPIKey(apikey) {
    await this.doc.useApiKey(apikey)
    
    await this.authComplete()
  }
  async authComplete() {
    this.authenticated = true
    await this.doc.loadInfo().catch(async function(err){
      var error = await err.toJSON()
      throw Error(`Google API threw an error: ${error.stack}`)
    })
    if(this.debug) console.log("authenticated")
  }
  async docInfo() {
    if(!this.authenticated) throw Error("Not Authenticated")

    return this.doc
  }
  async sheet(sheetname) {
    const sheet = this.doc.sheetsByTitle[sheetname];
    if(!sheet) throw Error(`Sheet with this name does not exist: ${sheetname}`)
    
    const rows = await sheet.getRows()
    const headers = sheet.headerValues

    return {sheet,rows,headers}
  }
  async index(sheetname,customprimarykey) {
    var {sheet,rows,headers} = await this.sheet(sheetname)
  
    const primarykey = customprimarykey || headers[0]
    if(this.debug) console.log("primary key:",primarykey)
  
    var data = {}
    for(var i in rows) {
      var row = rows[i]
      var rowdata = this.rowparser(headers,row)
      if(this.debug) console.log("row data",rowdata)
      data[row[primarykey]] = rowdata
    }

    return data
  }
  async list(sheetname) {
    var {sheet,rows,headers} = await this.sheet(sheetname)
  
    var data = []
    for(var i in rows) {
      var row = rows[i]
      var rowdata = this.rowparser(headers,row)
      if(this.debug) console.log("row data",rowdata)
      data.push(rowdata)
    }

    return data
  }
  rowparser(headers,row) {
    var rowdata = {}

    for(var n in headers) {
      var header = headers[n]

      // ARRAY
      if(/^a([0-9]{1,3}):.*$/.test(header)) {
        var newheader = header.replace(/a([0-9]{1,3}):/,"")
        
        if(!rowdata.hasOwnProperty(newheader)) {
          rowdata[newheader] = []
        }

        if(row[header]) {
          rowdata[newheader].push(row[header])
        }
      } else {
        // NORMAL DATA
        rowdata[header] = row[header]
      }
    }
    
    return rowdata
  }
  async get(sheetname,key,customprimarykey) {
    var index = await this.index(sheetname,customprimarykey)

    return index[key]
  }
}