const assert = require('assert')
const {
	Price,
	ERR_PRICEMANDATORY,
	ERR_PRICE0,
	ERR_PRICE10000,
	ERR_PRICE100000
} = require('../src/Price')
const mongoose = require('mongoose')

describe('***  price: test Create  ***', () => {
	it(':: Save price => prices', done => {
		const price = new Price({
			price: 12.3
		})
		assert(price.isNew)
		price
			.save()
			.then(() => {
				assert(!price.isNew)
				done()
			})
			.catch(err => {
				console.log(' -> failed : ', err)
			})
	})
	it(':: Save price => test validation By Required', done => {
		const price = new Price({})
		const validateResult = price.validateSync()
		const message = validateResult.errors.price.message
		assert(message === ERR_PRICEMANDATORY)
		done()
	})
	it(':: Save price => test validation By validator == 0', done => {
		const price = new Price({ price: 0 })
		price.validate(result => {
			const { message } = result.errors.price
			assert(message === ERR_PRICE0)
			done()
		})
	})
	it(':: Save price => test validation By validator > 10000', done => {
		const price = new Price({ price: 10500 })
		price.validate(result => {
			const { message } = result.errors.price
			assert(message === ERR_PRICE10000)
			done()
		})
	})
	it(':: Save price => test validation By validator > 100000', done => {
		const price = new Price({ price: 100500 })
		price.validate(result => {
			const { message } = result.errors.price
			assert(message === ERR_PRICE100000)
			done()
		})
	})
})
