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
      defaultHeaderConfiguration: {
        name: "",
        type: "string",
      }
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

  

  async sheet(sheetname,debug=this.debug) {
    if(!sheetname) throw Error("Sheet name is not defined")
    if(!this.authenticated) throw Error("Not Authenticated")

    const sheet = this.doc.sheetsByTitle[sheetname];
    if(!sheet) throw Error(`Sheet with this name does not exist: ${sheetname}`)

    const rows = await sheet.getRows()
    const rawHeaders = sheet.headerValues

    return {
      sheet,
      rows,
      rawHeaders
    }
  }
  

  
  async index(sheetname,customPrimaryKey,debug=this.debug) {
    if(!sheetname) throw Error("Sheet name is not defined")
    if(!this.authenticated) throw Error("Not Authenticated")

    var {sheet,rows,rawHeaders} = await this.sheet(sheetname)
    var headers = this.headersParser(rawHeaders)

    const primaryKey = customPrimaryKey || headers[0].name
    if(debug) console.log("primary key:",primaryKey)

    var data = {}
    for(var i in rows) {
      var row = rows[i]
      var rowData = this.rowParser(headers,row)
      if(debug) console.log("row data:",rowData)
      data[rowData[primaryKey]] = rowData
    }

    return data
  }

  async list(sheetname,debug=this.debug) {
    if(!sheetname) throw Error("Sheet name is not defined")

    if(!this.authenticated) throw Error("Not Authenticated")

    var {sheet,rows,rawHeaders} = await this.sheet(sheetname)
    var headers = this.headersParser(rawHeaders)

    var data = []
    for(var i in rows) {
      var row = rows[i]
      var rowdata = this.rowParser(headers,row)
      if(debug) console.log("row data",rowdata)
      data.push(rowdata)
    }

    return data
  }

  async groups(sheetname,groupBy,debug=this.debug) {
    if(!sheetname) throw Error("Sheet name is not defined")
    if(!this.authenticated) throw Error("Not Authenticated")

    var {sheet,rows,rawHeaders} = await this.sheet(sheetname)

    var headers = this.headersParser(rawHeaders)

    const groupByKey = groupBy || headers[0].name
    if(debug) console.log("grouping key:",groupByKey)

    var data = {}
    for(var i in rows) {
      var row = rows[i]
      var rowData = this.rowParser(headers,row,this.debug)

      if(debug) console.log("row data:",rowData)
      if(debug) console.log("grouping key:",groupByKey)
      var constituentGroups = rowData[groupByKey]
      if(!Array.isArray(constituentGroups)) {
        constituentGroups = [constituentGroups]
      }
      
      if(debug) console.log("constituent groups:",constituentGroups)

      for(var joiningGroup of constituentGroups) {
        if(debug) console.log("joining group:",joiningGroup)
        data[joiningGroup] ??= []
        data[joiningGroup].push(rowData)
      }
    }

    return data
  }

  async get(sheetname,key,customPrimaryKey,debug=this.debug) {
    if(!sheetname) throw Error("Sheet name is not defined")

    if(!this.authenticated) throw Error("Not Authenticated")

    var index = await this.index(sheetname,customPrimaryKey)

    return index[key]
  }


  
  headersParser(rawHeaders,debug=this.debug) {
    if(debug) console.log("Headers Parser")
    if(!rawHeaders) throw Error("Headers are not defined")

    var headers = []
    
    for(var n in rawHeaders) {
      var rawHeader = rawHeaders[n]
      if(debug) console.log("parsing raw header:",rawHeader)

      var headerConfiguration = Object.assign({},this.options.defaultHeaderConfiguration)

      headerConfiguration.raw = rawHeader
      var header = rawHeader.replace(/\[(.*)]$/mg, (_, attributesText)=>{
        Object.assign(
          headerConfiguration,
          this.attributesParser(attributesText)
        )

        return ""
      })

      headerConfiguration.name = header

      if(debug) console.log("parsed header:",headerConfiguration)
      headers.push(headerConfiguration)
    }

    if(debug) console.log("parsed headers:",headers)
    return headers
  }
  attributesParser(attributesText,withBrackets=false,debug=this.debug) {
    debug = true
    if(debug) console.log("Attributes Parser")
    if(debug) console.log("attribute raw text:",attributesText)

    if(withBrackets) attributesText = attributesText.slice(1,-1) 
    
    var attributesData = {}

    var pattern = /(\w+)=(.+?)(?=\s|$)/g;
    var matches = attributesText.matchAll(pattern);
    
    var nested = undefined
    for (const match of matches) {
      const key = match[1].trim();
      const value = match[2].trim();
      if(debug) console.log("attribute: key:",key,"value:",value)

      if(value.startsWith("[")) {
          nested = key
      } else if(nested) {
            attributesData[nested] += ` ${key}=${value}`
          if(value.endsWith("]")) {
              nested = undefined
          }
          continue
      }

      attributesData[key] = value
    }

    if(debug) console.log("parsed attributes:",attributesData)
    return attributesData
  }

  rowParser(headers,row,debug=this.debug) {
    if(debug) console.log("Row Parser")
    if(!row) throw Error("Row is not defined")

    var rowdata = {}

    for(var n in headers) {
      var header = headers[n]
      if(debug) console.log("header:",header)
      
      rowdata[header.name] = this.typeParser(row[header.raw],header.type,header)
      if(debug) console.log("parsed data:",rowdata[header.name])
    }

    return rowdata
  }

  TYPE_OPTIONS = {
    string: {
      trim: true
    },
    array: {
      separator: ",",
      elementType: "string"
    },
    int: {
      nanValue: 0
    }
  }
  TYPE_PARSER = {
    string: (content,typeoptions,debug=this.debug) => {
      var parsed = content.toString()
      if(typeoptions.trim) parsed = parsed.trim()
      return parsed
    },
    array: (content,typeoptions,debug=this.debug) => {
      var elements = content.split(typeoptions.separator)
      if(debug) console.log("elements:",elements)

      var parsed = []
      for(var i in elements) {
        var element = elements[i]
        if(debug) console.log("element:",element)

        var elementAttributes = Object.assign({},this.TYPE_OPTIONS.array)
        if(typeoptions.elementAttributes) {
          var customElementAttrs = typeoptions.elementAttributes
          if(debug) console.log("custom element attributes:",customElementAttrs)
          elementAttributes = this.attributesParser(customElementAttrs,true)
        }
        
        if(debug) console.log("element attributes:",elementAttributes)

        if(
          elementAttributes.elementType == "array"
          &&
          elementAttributes.separator == typeoptions.separator
        ) {
          throw Error("Created a infinite array sepration loop")
        }
        
        var parsedElement = this.typeParser(element,typeoptions.elementType,elementAttributes)
        if(debug) console.log("parsed element:",parsedElement)

        parsed.push(parsedElement)
      }

      if(debug) console.log("parsed array:",parsed)
      
      return parsed
    },
    int: (content,typeoptions,debug=this.debug) => {
      var parsed = parseInt(content)
      if(isNaN(parsed)) parsed = typeoptions.nanValue
      return parsed
    }
  }
  typeParser(content,type,options,debug=this.debug) {
    if(debug) console.log("Type Parser")
    if(!type) throw Error("Type is not defined")

    if(this.options.undefinedifblank && !content) return undefined
    else if(!content) return ""

    // Verify  type
    if(debug) console.log("type:",type)
    var validType = Object.keys(this.TYPE_PARSER).includes(type)
    if(!validType) throw Error(`Invalid type: ${type}`)

    // Add Type Options
    if(!this.TYPE_OPTIONS[type]) throw Error(`Type options not defined: ${type}`)
    var typeoptions = Object.assign({},this.TYPE_OPTIONS[type])
    Object.assign(typeoptions,options)
    if(debug) console.log("type options:",typeoptions)

    var parsed = this.TYPE_PARSER[type](content,typeoptions,debug)
    if(debug) console.log("parsed:",parsed)

    return parsed
  }
}