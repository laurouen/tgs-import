const assert = require('assert')
const { Vendor, ERR_VENDORMANDATORY } = require('../src/Pdv')
const { Price } = require('../src/Price')
const mongoose = require('mongoose')

describe('***  vendor: test relation  ***', () => {
	it('***  vendor: test relation  ***', done => {
		const price1 = new Price({ price: 10 })
		price1
			.save()
			.then(() => {
				const price2 = new Price({ price: 210 })
				price2
					.save()
					.then(() => {
						const vendor = new Vendor({
							name: 'macdo',
							prices: [price1, price2]
						})
						vendor
							.save()
							.then(() => {
								Vendor.findOne({})
									.then(vendor => {
										assert(vendor.prices.length === 2)
										done()
									})
									.catch(e => console.log('catch : ', e))
							})
							.catch(e => console.log('catch : ', e))
					})
					.catch(e => console.log('catch : ', e))
			})
			.catch(e => console.log('catch : ', e))
	})
})
