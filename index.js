// const _ClusterSearch = require('./ClusterSearch')
const fs = require('fs')
const homedir = require('os').homedir()

const _ClusterSearch = async (Threads, ArrObj, SearchKey, SearchMatch) => {
    // ClusterSearch
    // Optimal: ~ 4 - 5 threads
    // After testing, normal results showed x5 - x10 search speed increase

    // Determine how to split search

    let Length = ArrObj.length
    const Divider = parseInt(Length / Threads)
    
    let Ranges = []

    Length-- // Length is given in absolute

    while (Length >= 1) {
        Ranges.push({
            End: Length,
            Start: (Length - Divider > 0) ? Length - Divider : 0
        })
        Length -= Divider + 1
    }

    // let recordssearched = 0

    return new Promise((resolve, reject) => {
        Ranges.forEach(range => {
            for (let i = range.Start; i < range.End + 1; i++) {
                // recordssearched++                
                if (ArrObj[i][SearchKey] === SearchMatch) resolve({index: i + range.Start - 1, data: ArrObj[i]})
            }
        })
        reject(false)
    })
}

module.exports = class Table {
    constructor (name, schema, config) {

        this.FILE = homedir + '/mdb/' + name + '.json'

        this.config = {
            sync: true,
            validate: false, // Not yet supported
            idName: 'id',
            ...config
        }

        if (fs.existsSync(this.FILE) && this.config.sync) {
            this.Load()
        } else {
            const DefaultSchemaConfig = {
                unique: false,
                type: String,
                min: Infinity,
                max: Infinity,
                onlyChar: false,
                onlyNonChar: false,
                index: false,
                required: false
            }

            if (!schema.id) {
                schema.id = {
                    unique: true,
                    type: Number,
                    min: 0,
                    index: true
                }
            }

            this.schema = schema

            this.keys = Object.keys(schema)

            this.indexKeys = {}

            this.keys.forEach(key => {
                schema[key] = {
                    ...DefaultSchemaConfig,
                    ...schema[key]
                }
                if (schema[key]['index']) this.indexKeys[key] = this.keys.indexOf(key)
            })

            this.table = []

            this.idCount = 0

            this.Save()
        }
    }

    Insert (Record, callback) {
        if (typeof Record === "object") {
            if (Array.isArray(Record)) {
                let result = {
                    valid: [],
                    invalid: []
                }                
                Record.forEach(Entry => {
                    // Validate, then =>
                    Entry.id = this.idCount++
                    let temp = []
                    this.keys.forEach(key => {
                        temp.push(Entry[key])
                    })
                    this.table.push(temp)
                })
            } else {
                // Validate, then =>
                let temp = []
                Record.id = this.idCount++
                this.keys.forEach(key => {
                    temp.push(Record[key])
                })
                this.table.push(temp)
            }
            if (callback) callback(Record)
        } else callback(new Error('Invalid Object'))
        this.Save()
    }

    Get (Key, Value, ReturnIndex) {
        if (!this.indexKeys[Key] && this.indexKeys[Key] !== 0) return `Key not indexed!`
        let results = []
        this.table.forEach((Record, Index) => {
            if (Record[this.indexKeys[Key]] === Value) {
                let out = {}
                this.keys.forEach((key, index) => {
                    out[key] = Record[index]
                })
                results.push(ReturnIndex ? Index : out)
            }
        })
        this.Save()
        return results
    }

    ClusterSearch (Key, Value, Threads) {
        return new Promise((resolve, reject) => {
            _ClusterSearch(Threads || 5, this.table, this.indexKeys[Key], Value)
                .then(x => resolve(x))
                .catch(y => reject(y))
        })
    }

    ClusterRemove (Id, callback) {
        this.ClusterSearch('id', Id)
            .then(res => {
                delete this.table[res.index]
                if (callback) callback()
            })
            .catch(err => {
                callback(err)
            })
    }

    Remove (Id) {
        delete this.table[this.Get('id', Id, true)]
        this.Rebuild()
        this.Save()
    }

    Update (Data) {
        if (!Array.isArray(Data)) Data = [Data]
        Data.forEach(data => {
            data = {
                ...this.Get('id', data.id)[0],
                ...data
            }
            let Record = []
            this.keys.forEach(key => {
                Record.push(data[key])
            })
            this.table[this.Get('id', data.id, true)[0]] = Record
        })
        this.Save()
        return Data
    }

    Rebuild () {
        let newTable = []
        this.table.forEach(Record => {
            if (Record) newTable.push(Record)
        })
        this.table = newTable
    }

    Save () {
        fs.writeFileSync(this.FILE, JSON.stringify(this))
    }

    Load () {
        const data = require(this.FILE)
        Object.keys(data).forEach(key => {
            this[key] = data[key]
        })
    }
}