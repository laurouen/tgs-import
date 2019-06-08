const mongoose = require('mongoose')

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

before(done => {
	mongoose.connect('mongodb://localhost/test_Essence', {
		useNewUrlParser: true
	})

	mongoose.connection
		.once('open', () => {
			console.log('----------------------------')
			console.log('!!   Connexion établie    !!')
			console.log('----------------------------')
			done()
		})
		.on('error', error => {
			console.log('Erreur de connexion : ', error)
		})
})

beforeEach('<<< Suppression des collections avant les tests ! >>>', done => {
	const { prices, vendors } = mongoose.connection.collections
	if (prices) {
		prices.drop(() => {
			console.log('<<<------- efface prices ------------->>>')
			if (prices) {
				prices.drop(() => {
					console.log('<<<------- efface vendors ------------->>>')
					done()
				})
			}
		})
	} else {
		console.error(
			'<<< prices is empty ----- imposible de purger la db ------------------>>>'
		)
		done()
	}
})
