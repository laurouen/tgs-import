const mongoose = require('mongoose')
const Schema = mongoose.Schema

const logimportSchema = new Schema({
    name: String,
    dateZipCurled: {
        type: Date,
        default: Date.now
    },
	dateImport2Bdd: {
        type: Date,
        default: null
    },
    resultImportPdv: {
        type: String,
        default: ''
    },
    resultImportPrix: {
        type: String
        default: ''
    }
})

const Logimport = mongoose.model('logimport', logimportSchema)

module.exports = Logimport
