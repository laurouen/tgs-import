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

priceSchema.virtual('price.current').get(function() {
	const price = this.prices.reduce((prev, curr) => {
		return prev.date > curr.date ? prev : curr
	})
	return price.value
})
priceSchema.virtual('price.variation').get(function() {
	let variation = 0
	//sort prices
	if (this.prices.length > 1) {
		const prices = this.prices.sort((a, b) => {
			return a.date < b.date
		})
		variation = prices[0].value - prices[1].value
	}
	return variation
})

const Price = mongoose.model('price', priceSchema)

module.exports = Price
