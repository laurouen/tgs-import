const mongoose = require('mongoose')
const ERR = require('./ErrorMessages')
const Schema = mongoose.Schema

const brandSchema = new Schema({
	name: {
		type: String,
		required: [true, ERR.BRAND.NAMEISMANDATORY],
		unique: true
	},
	logo: {
		type: String,
		default:
			'https://www.lagardedenuit.com/wiki/images/1/12/Blason-inconnu-2014-v01-256px.png'
	}
})

const Brand = mongoose.model('brand', brandSchema)

module.exports = Brand
