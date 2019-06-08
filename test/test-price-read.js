const assert = require('assert')
const { Price } = require('../src/Price')
const mongoose = require('mongoose')

describe('***  price: test Read  ***', () => {
	let priceReference
	beforeEach(done => {
		priceReference = new Price({ price: 12.5 })
		priceReference.save().then(() => {
			console.log('<<<------- Create priceReference ----->>>')
			done()
		})
	})

	it(':: Recherche d un prix par son montant', done => {
		Price.find({ price: priceReference.price })
			.then(prices => {
				assert(prices[0]._id.equals(priceReference._id))
				done()
			})
			.catch(err => console.error(' -> failed : ', err))
	})

	it(':: Recherche d un prix par son id', done => {
		Price.findOne({ _id: priceReference._id })
			.then(price => {
				assert(price.price === priceReference.price)
				done()
			})
			.catch(err => console.error(' -> failed : ', err))
	})
})
