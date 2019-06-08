const assert = require('assert')
const { Price } = require('../src/Price')
const mongoose = require('mongoose')

describe('***  price: test Delete  ***', () => {
	let priceReference
	beforeEach(done => {
		priceReference = new Price({ price: 12.5 })
		priceReference.save().then(() => {
			console.log('<<<------- Create priceReference ----->>>')
			done()
		})
	})

	const assertDelete = (promise, done) => {
		promise
			.then(() => {
				Price.findOne({ price: priceReference.price })
					.then(price => {
						assert(price === null)
						done()
					})
					.catch(err => console.error(' -> failed : ', err))
			})
			.catch(err => console.error(' -> failed : ', err))
	}
	it(':: update from instance', done => {
		assertDelete(priceReference.deleteOne(), done)
	})
	it(':: delete from Model', done => {
		assertDelete(Price.deleteOne({ price: priceReference.price }), done)
	})
	it(':: findOneAndDelete by price', done => {
		assertDelete(Price.findOneAndDelete({ price: priceReference.price }), done)
	})
	it(':: findByIdAndUDelete price', done => {
		assertDelete(Price.findByIdAndDelete(priceReference._id), done)
	})
})
