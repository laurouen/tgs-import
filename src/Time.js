const mongoose = require('mongoose')
const Schema = mongoose.Schema

const timeSchema = new Schema({
	opening: {
		type: String,
		default: '01.00'
	},
	closing: {
		type: String,
		default: '01.00'
	}
})

const Time = mongoose.model('time', timeSchema)

module.exports = Time
