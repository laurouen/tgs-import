const mongoose = require('mongoose')

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

mongoose.connect('mongodb://localhost/Essence', {
	useCreateIndex: false,
	useNewUrlParser: true
})

mongoose.connection
	.once('open', () => {
		console.log('----------------------------')
		console.log('!!   Connexion établie    !!')
		console.log('----------------------------')

		dropDatabase()
	})
	.on('error', error => console.log('Erreur de connexion : ', error))

const dropDatabase = function() {
	mongoose.connection.db
		.dropDatabase()
		.then(() => {
			stop('Drop database successfull !')
		})
		.catch(e => {
			console.error('failed to drop database : ', e)
		})
}

const stop = function(where = 'not determined') {
	console.log('STOP PROGRAMME ! (%s)', where)
	process.exit(0)
}
