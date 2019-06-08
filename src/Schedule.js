const mongoose = require('mongoose')
const Schema = mongoose.Schema
const TimeSchema = require('./Time').schema

const scheduleSchema = new Schema({
	jour: {
		type: String,
		enum: [
			'Lundi',
			'Mardi',
			'Mercredi',
			'Jeudi',
			'Vendredi',
			'Samedi',
			'Dimanche'
		]
	},
	active: {
		type: Boolean
	},
	times: [TimeSchema]
})

const Schedule = mongoose.model('schedule', scheduleSchema)

module.exports = Schedule
