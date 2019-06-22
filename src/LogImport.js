const mongoose = require('mongoose')
const Schema = mongoose.Schema

const logimportSchema = new Schema({
    name: String,
    dateZipCurled: Date,
	dateImport2Bdd: Date,
})

const Logimport = mongoose.model('logimport', logimportSchema)

module.exports = Logimport
