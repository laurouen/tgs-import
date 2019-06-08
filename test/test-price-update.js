const assert = require('assert')
const { Price } = require('../src/Price')
const mongoose = require('mongoose')

describe('***  price: test Update  ***', () => {
	let priceReference
	let updatedPrice = 100
	beforeEach(done => {
		priceReference = new Price({ price: 12.5 })
		priceReference.save().then(() => {
			console.log('<<<------- Create priceReference ----->>>')
			done()
		})
	})

	const assertPrice = (promise, done) => {
		promise
			.then(() => {
				Price.findOne({})
					.then(price => {
						assert(price.price === updatedPrice)
						done()
					})
					.catch(err => console.error(' -> failed : ', err))
			})
			.catch(err => console.error(' -> failed : ', err))
	}
	it(':: update from instance', done => {
		priceReference.set({ price: updatedPrice })
		assertPrice(priceReference.save(), done)
	})
	it(':: update from Model', done => {
		assertPrice(
			Price.updateOne({ price: priceReference.price }, { price: updatedPrice }),
			done
		)
	})
	it(':: findOneAndUpdate by price', done => {
		assertPrice(
			Price.findOneAndUpdate(
				{ price: priceReference.price },
				{ price: updatedPrice }
			),
			done
		)
	})
	it(':: findByIdAndUpdate price', done => {
		assertPrice(
			Price.findByIdAndUpdate(priceReference._id, { price: updatedPrice }),
			done
		)
	})
})
