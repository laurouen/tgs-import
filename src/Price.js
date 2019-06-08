const mongoose = require('mongoose')
const ERR = require('./ErrorMessages')
const Schema = mongoose.Schema

const priceSchema = new Schema({
	id: {
		type: Number,
		required: [true, ERR.PDV.IDISMANDATORY]
	},
	name: {
		type: String
	},
	pdv: {
		type: Number, //id pdv
		required: [true, ERR.PRICE.PDVISMANDATORY]
	},
	prices: [
		{
			date: {
				type: String
			},
			value: {
				type: Number,
				default: 0
			}
		}
	]
})

priceSchema.virtual('currentPrice').get(() => {
	return this.prices.reduce((prev, curr) => {
		return prev.date > curr.date ? prev : curr
	}).value
})

const Price = mongoose.model('price', priceSchema)

module.exports = Price
