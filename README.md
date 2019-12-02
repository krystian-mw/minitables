# MiniTables

A abstract table-only database.

**Zero:**
- Dependencies
- Promises
- Response Delays

# Install

Simply `require` the `index.js` file.
Submission to the NPM registry currently in progress. 

# Usage

Import `./minitables/index` and create a new table.
We will assume there is a `./config.json` file that contains server configuration files

We will create a `_session` variable, because `MiniTables` will **save data (sync), so that that data is not lost during restart**.

### Initialize
```javascript
const MiniTables = require('./minitables/index');
const config = require('./config.json');
const TableName = `SessionStorage-${config._session}` || 'SessionStorage';

const Schema = config.schema || {
	uuid: {
		required: true,
		unique: true,
		index: true,
		min: 36,
		max: 36,
		onlyChar: true
	},
	token: {
		required: true,
		min: 64,
		max: 128,
		onlyChar: true
	},
	expiry: {
		type: Number,
		min: new Date().getTime(),
		max: new Date().getTime() + 1000000
	}
}

const SessionStorage = new MiniTables(TableName, Schema, config.MiniTablesConfig);
```

### CRUD
#### Create
```javascript

const uuid = () => {return(""+1e7+-1e3+-4e3+-8e3+-1e11).replace(/1|0/g,function(){return(0|Math.random()*16).toString(16)})}

SessionStorage.Insert({
	hash: uuid(),
	token: uuid(),
	expiry: new Date().getTime() + (1000 * 60 * 60 * 24 * 7) // 7 days
});

// Or in batches, as an array

// Generate 10 random records
let temp = [];

for (let i = 0; i < 10; i++) {
	temp.push({ hash: uuid(), token: uuid(), expiry: new Date().getTime() + (1000 * 60 * 60 * 24 * 7) })
}

SessionStorage.Insert(temp);
```
#### Read
**Records are returned in arrays!**
```javascript
const server = (req, res) => {
	// .Get(SearchIndexedKey, SearchValue)
	const uuid = SessionStorage.Get('uuid', req.cookies.uuid) 
	/*
		RESULTS ARE ALWAYS RETURN IN ARRAYS
	*/
	if (uuid[0].token === req.cookies.token) {
		...
	}
}
```
#### Update
Simple as:
```javascript
SessionStorage.Update({
	uuid: req.cookies.uuid,
	token: uuid()
});
```
#### Delete
Each record will have a `id` key by default (which can be renamed, in this example `uuid` would be the perfect and only candidate).

**RECORDS CAN ONLY BE DELETED BY THEIR ID's**
```javascript
...
	const id = SessionStorage.Get('uuid', req.cookies)[0].id;
	SessionStorage.Remove(id);
	
...
```

# Source Configuration Defaults

```javascript
module.exports  =  class  Table {
	constructor (name, schema, config) {
		this.FILE  =  homedir  +  '/minitables/'  +  name  +  '.json' 
		this.config  = { //  Tables
			sync:  true, // If true, save upon each change to a file
			validate:  false, // Not yet supported
			idName:  'id', 
			/* Each table requires a id,
			and have at least ONE index key,
			as !!! only indexed keys will be able to get searched by !!! */
			...config
		}

		...

		const  DefaultSchemaConfig  = { // Keys
			unique: false,
			type:  String,
			min:  Infinity,
			max:  Infinity,
			onlyChar:  false, // Regex A-Z, a-z, -, (space) e.g Names
			onlyNonChar:  false, // Numbers and special chars only
			index:  false,
			required:  false // allow nulls
		}
		
		...
		
	}
}
```
