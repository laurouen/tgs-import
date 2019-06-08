const mongoose = require('mongoose')
const Schema = mongoose.Schema

const serviceSchema = new Schema({
	name: {
		type: String
	},
	icone: {
		type: String
	}
})

const Service = mongoose.model('service', serviceSchema)

module.exports = Service
