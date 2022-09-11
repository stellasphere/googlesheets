const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

module.exports = class GoogleSheets {
  constructor(sheetid,options) {
    this.docid = sheetid
    this.authenticated = false
    this.doc = new GoogleSpreadsheet(sheetid)
    
    var defaultoptions = {
      undefinedifblank: true,
      typerecognition: true,
      debug: false,
    }
    options = options || {}
    this.options = Object.assign(defaultoptions,options)

    this.debug = this.options.debug
  }
  async authViaServiceAccount(clientemail,privatekey) {
    if(!clientemail) throw Error("Client email is not defined")
    if(!privatekey) throw Error("Private key is not defined")

    privatekey = privatekey.replace(/\\n/gm,`\n`)
    
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
    if(!apikey) throw Error("API key is not defined")
    
    await this.doc.useApiKey(apikey)
    
    await this.authComplete()
  }
  async docInfo() {
    if(!this.authenticated) throw Error("Not Authenticated")

    return this.doc
  }
  async sheet(sheetname) {
    if(!sheetname) throw Error("Sheet name is not defined")
    
    if(!this.authenticated) throw Error("Not Authenticated")

    const sheet = this.doc.sheetsByTitle[sheetname];
    if(!sheet) throw Error(`Sheet with this name does not exist: ${sheetname}`)
    
    const rows = await sheet.getRows()
    const headers = sheet.headerValues

    return {sheet,rows,headers}
  }
  async index(sheetname,customprimarykey) {
    if(!sheetname) throw Error("Sheet name is not defined")
    
    if(!this.authenticated) throw Error("Not Authenticated")

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
    if(!sheetname) throw Error("Sheet name is not defined")
    
    if(!this.authenticated) throw Error("Not Authenticated")

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
  async get(sheetname,key,customprimarykey) {
    if(!sheetname) throw Error("Sheet name is not defined")
    
    if(!this.authenticated) throw Error("Not Authenticated")

    var index = await this.index(sheetname,customprimarykey)

    return index[key]
  }
  async authComplete() {
    this.authenticated = true
    await this.doc.loadInfo().catch(async function(err){
      var error = await err.toJSON()
      throw Error(`Google API threw an error: ${error.stack}`)
    })
    if(this.debug) console.log("authenticated")
  }
  rowparser(headers,row) {
    if(!headers) throw Error("Headers are not defined")
    if(!row) throw Error("Row is not defined")
    
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

      if(this.options.undefinedifblank) {
        if(rowdata[header] !== undefined) {
          if(rowdata[header].length < 1) rowdata[header] = undefined
        }
      } else {
        if(rowdata[header] == undefined) rowdata[header] = ""
      }
    }
    
    return rowdata
  }
}