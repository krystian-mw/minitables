# minitables

Zero:

* Dependancies
* Promises
* Delays

Data is synced so during process restart it will still be present

## Install

Simply include `index.js`:

`const MT = require('./minitables')`

** Note - not officialy yet on NPM

## Usage

### Create a table

`const ServerSessionStorage = new MT('ServerSessionStorage', {
  hash: {
    required: true,
    type: String,
    index: true,
    min: 0,
    max: 65536,
    unique: true
  },
  token: {
    required: true,
    type: String,
    index: false,
    min: 0,
    max: 64
  },
  expiry: {
    required: true,
    min: new Date().getTime(),
    max: new Date().getTime() + 1000000,
    index: false
  }
})`

### Insert Record

`ServerSessionStorage.Insert({
  hash: 'someRandomHash',
  token: 'someUUID',
  expiry: new Data().getTime() + 36000
})`

### Retrieve Record

`ServerSessionStorage.Get({
  hash: 'someRandomHash'
 })`

### Update Record

`ServerSessionStorage.Update({
  hash: 'someRandomHash',
  token: 'anotherUUID'
})`

### Delete Record

`const id = ServerSessionStorage.Get('hash', 'someRandomHash').id
ServerSessionStorage.Remove(id)`
