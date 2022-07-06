# @stellasphere/google-sheets

A simple Google Sheets API wrapper designed to be able to access sheet data in a database-like way.

## Installation

Install `@stellasphere/google-sheets` with npm

```bash
npm install @stellasphere/google-sheets
```
    
## Guide
Using this [testing spreadsheet](https://docs.google.com/spreadsheets/d/1x268zkmymCjNm_iUwBM4v4EQCjT0H5IwcVAB-rfZ9x8/edit?usp=sharing).
Occuring in a async function:
```js
const GoogleSheets = require("@stellasphere/google-sheets")
var sheet = new GoogleSheets("1x268zkmymCjNm_iUwBM4v4EQCjT0H5IwcVAB-rfZ9x8")

init()

async function init() {
  // Remember to remove all but one of the authentication methods.
  // AUTHENTICATION VIA API KEY
  await sheet.authViaAPIKey(process.env.googleapikey) // Get from: https://console.cloud.google.com/apis/credentials/key 


  // AUTHENTICATION VIA SERVICE ACCOUNT
  await sheet.authViaServiceAccount(process.env.clientemail, process.env.privatekey) // Get from: https://console.cloud.google.com/iam-admin/serviceaccounts


  // AUTHENTICATION VIA SERVICE ACCOUNT FILE
  await sheet.authViaServiceAccountFile("./authentication.json") // Get from: https://console.cloud.google.com/iam-admin/serviceaccounts


  // GET THE ROWS IN A INDEX
  var index = await sheet.index("sheet")
  console.log(index)
  /*
  {
    '123': { id: '123', name: 'testing' },
    '234': { id: '234', name: 'testing2' },
    '345': { id: '345', name: 'testing3' },
    '456': { id: '456', name: undefined }
  }
  */


  // GET THE ROWS IN A ARRAY
  var list = await sheet.list("sheet")
  console.log(list)
  /*
  [
    { id: '123', name: 'testing' },
    { id: '234', name: 'testing2' },
    { id: '345', name: 'testing3' },
    { id: '456', name: undefined }
  ]
  */


  // GET THE ROW
  var result = await sheet.get("sheet","123")
  console.log(result)
  /*
  {
    id: '123',
    name: 'testing'
  }
  */
}
```


## API Reference

### Inital Constructor

#### GoogleSheets

```js
  new GoogleSheets(sheetid,options)
```
Constructor

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `sheetid` | `string` | **Required**. Your Google Sheets document ID. (Visible in the url: https://docs.google.com/spreadsheets/d/*id*/edit#gid=0) |
| `options` | `GoogleSheetsOptions` | Valid options are `undefinedifblank` and `debug` |





### Authentication

#### GoogleSheets().authViaServiceAccount(clientemail,privatekey)
Authenticates using a service account client email and private key. Service accounts are created on the [service accounts page on Google Cloud Console.](https://console.cloud.google.com/iam-admin/serviceaccounts)
To use the JSON file, use `authViaServiceAccountFile()`.
```js
  var sheet = new GoogleSheets()
  await sheet.authViaServiceAccount(clientemail,privatekey)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `clientemail` | `string` | **Required**. The client email of a service account. |
| `privatekey` | `string` | **Required**. The private key of a service account. |





#### GoogleSheets().authViaServiceAccountFile(path)
Authenticates using a service account client email and private key. Service accounts are created on the [service accounts page on Google Cloud Console.](https://console.cloud.google.com/iam-admin/serviceaccounts)
```js
  var sheet = new GoogleSheets()
  await sheet.authViaServiceAccountFile(path)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `path` | `filepath` | **Required**. The file path of a service account JSON key. |





#### GoogleSheets().authViaAPIKey(apikey)
Authenticates using a API key. API keys are created on the [credentials page on Google Cloud Console](https://console.cloud.google.com/apis/credentials/key). 
```js
  var sheet = new GoogleSheets()
  await sheet.authViaAPIKey(apikey)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `apikey` | `string` | **Required**. The API key for Google Sheets API. |






### Google Sheet Methods

#### GoogleSheets().docInfo()
Gets the information on the Google Sheet document file.
```js
  var sheet = new GoogleSheets()
  var result = await sheet.docInfo()
```






#### GoogleSheets().sheet(sheetname)
Gets the sheet information, rows and headers. 
```js
  var sheet = new GoogleSheets()
  var result = await sheet.sheet(sheetname)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `sheetname` | `string` | **Required**. The name of the sheet or "worksheet". |






#### GoogleSheets().index(sheetname,customprimarykey)
Gets the rows of the sheet in the form of a object. The primary key will be the first header available if a custom one is not specified.
```js
  var sheet = new GoogleSheets()
  var result = await sheet.index(sheetname,customprimarykey)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `sheetname` | `string` | **Required**. The name of the sheet or "worksheet". |
| `customprimarykey` | `string` | A optional custom primary key. |






#### GoogleSheets().list(sheetname)
Gets the rows of the sheet in the form of an array of objects.
```js
  var sheet = new GoogleSheets()
  var result = await sheet.list(sheetname)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `sheetname` | `string` | **Required**. The name of the sheet or "worksheet". |






#### GoogleSheets().get(sheetname,key,customprimarykey)
Gets a row from the sheet in the form of a object. 
```js
  var sheet = new GoogleSheets()
  var result = await sheet.get(sheetname,key,customprimarykey)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `sheetname` | `string` | **Required**. The name of the sheet or "worksheet". |
| `key` | `string` | **Required**. Id of item to fetch |
| `customprimarykey` | `string` | **Required**. Id of item to fetch |




### Internal Functions




#### GoogleSheets().rowparser(headers,row)
This is a internal function. It parses a array of headers and a Google Sheets API row object.
```js
  var sheet = new GoogleSheets()
  var result = await sheet.rowparser(headers,row)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `headers` | `string` | **Required**. Id of item to fetch |
| `row` | `string` | **Required**. Id of item to fetch |






#### GoogleSheets().authComplete()
This is a internal function. It sets the `authenticated` property true and loads the document info.
```js
  var sheet = new GoogleSheets()
  await sheet.authComplete()
```




