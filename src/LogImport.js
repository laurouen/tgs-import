const mongoose = require('mongoose')
const Schema = mongoose.Schema

const logimport = new Schema({
    name: String,
    dateZipCurled: Date,
	dateImport2Bdd: Date,
})

const Logimport = mongoose.model('logimport', serviceSchema)

module.exports = Logimport
