const mongoose = require('mongoose')
const ERR = require('./ErrorMessages')
const Schema = mongoose.Schema
const ScheduleSchema = require('./Schedule').schema

const pdvSchema = new Schema({
	id: {
		type: Number,
		required: [true, ERR.PDV.IDISMANDATORY]
	},
	name: {
		type: String
	},
	brand: {
		/*type: Schema.Types.ObjectId,
		ref: 'brand'*/
		type: String
	},
	latitude: {
		type: Number,
		default: 0
	},
	longitude: {
		type: Number,
		default: 0
	},
	adresse: {
		type: String
	},
	cp: {
		type: String
	},
	ville: {
		type: String
	},
	pop: {
		type: String,
		enum: ['R', 'A'],
		default: 'R'
	},
	automate2424: {
		type: Boolean,
		default: false
	},
	active: {
		type: Boolean,
		default: false
	},
	schedule: [
		/*ScheduleSchema*/ {
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
			times: [
				/*TimeSchema*/ {
					opening: {
						type: String,
						default: '01.00'
					},
					closing: {
						type: String,
						default: '01.00'
					}
				}
			]
		}
	],
	services: [
		{
			/*type: Schema.Types.ObjectId,
			ref: 'service'*/
			type: String
		}
	]
})

const Pdv = mongoose.model('pdv', pdvSchema)

module.exports = Pdv
