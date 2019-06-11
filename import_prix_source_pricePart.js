const mongoose = require('mongoose')
const fs = require('fs')
const Price = require('./src/Price')
const Pdv = require('./src/Pdv')

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

let indexPdv = 0
let indexPrices = 0
let pdvs = []
let currentPdv = null
let prices = []
let essences = []
let incCreatePrice = 0
let incUpdatePrice = 0

mongoose.connect('mongodb://localhost/Essence', {
	useCreateIndex: true,
	useNewUrlParser: true
})

mongoose.connection
	.once('open', () => {
		console.log('----------------------------')
		console.log('!!   Connexion établie    !!')
		console.log('----------------------------')

		readSource()
	})
	.on('error', error => console.log('Erreur de connexion : ', error))

const readSource = function() {
	/*fs.readFile(
		'archives/prix_source20190602.json',
		'utf-8',
		(err, pdvsFromFile) => {*/
	fs.readFile('prix_source20190606.json', 'utf-8', (err, pdvsFromFile) => {
		if (err) {
			console.log('Erreur lecture fichier : ', err)
			stop()
		}
		pdvs = JSON.parse(pdvsFromFile)
		setTimeout(function() {
			pdvs = pdvs.pdv_liste.pdv
			readNextPdvs()
		}, 3000)
	})
}

const readNextPdvs = function() {
	if (indexPdv > pdvs.length) {
		console.log('nb d enregistrements : ', pdvs.length)
		console.log('nb prix créés : ', incCreatePrice)
		console.log('nb prix updaté : ', incUpdatePrice)
		stop('Fin d import !')
	}
	if (pdvs[indexPdv]) {
		console.log('next Pdv :', indexPdv)
		currentPdv = pdvs[indexPdv++]
		Pdv.findOne({ id: currentPdv.id }, function(err, getPdv) {
			if (err) {
				console.error(
					'Erreur lors de la recherche de Pdv  : pdvId: %s ',
					currentPdv.id
				)
				stop('recherche pdv : failed')
			}
			if (getPdv == null) {
				stop(
					'ERREUR (manque la ref pdv.id: ' +
						currentPdv.id +
						' ) vous devez lancer import_prix_source_pdvPart.js'
				)
			}
			if (currentPdv.prix instanceof Array && currentPdv.prix.length > 0) {
				indexPrices = 0
				prices = currentPdv.prix
				readNextPrice()
			} else {
				readNextPdvs()
			}
		})
	} else {
		indexPdv++
		readNextPdvs()
	}
}

const readNextPrice = function() {
	if (indexPrices >= prices.length) {
		readNextPdvs
	}
	console.log('next Price :', indexPrices)
	const price = prices[indexPrices++]
	if (price) {
		findPrice(price)
	} else {
		readNextPdvs()
	}
}

const findPrice = function(price) {
	console.log(
		'looking for price : price.id:%s and pdv:%s ',
		price.id,
		currentPdv.id
	)
	let { id, valeur, nom, maj } = price
	Price.findOne({ pdv: currentPdv.id, id: id }, function(err, getPrice) {
		if (err) {
			console.error(
				'Erreur lors de la recherche de Prix  : idPrix:%s  pdvId:%s',
				id,
				currentPdv.id
			)
			stop('recherche prix : failed')
		}
		if (getPrice == null) {
			//create Price
			incCreatePrice++
			createPrice(id, valeur, nom, maj)
		} else {
			//update price
			incUpdatePrice++
			let needToAdd = true
			for (let index = 0; index < getPrice.prices.length; index++) {
				const p = getPrice.prices[index]
				if (p.date === maj) {
					needToAdd = false
				}
			}

			if (needToAdd) {
				console.log(
					'update price => pdv:[%s] id:{%s} nom:%s maj:[%s] prix:%s',
					currentPdv.id,
					id,
					nom,
					maj,
					valeur
				)

				getPrice.prices.push({
					date: maj,
					value: valeur
				})

				//check max enreg prices
				while (getPrice.prices.length > 10) {
					getPrice = removeOldestPrice(getPrice)
				}

				getPrice
					.save()
					.then(() => readNextPrice())
					.catch(e => console.error('Update failed : ', e))
			} else {
				readNextPrice()
			}
		}
	})
}

const removeOldestPrice = function(getPrice) {
	const oldest = getPrice.prices.reduce(function(prev, current) {
		return prev.date < current.date ? prev : current
	})
	const index = getPrice.prices.indexOf(oldest)
	if (index !== -1) getPrice.prices.splice(index, 1)
	return getPrice
}

const createPrice = function(id, value, name, datetime) {
	console.log(
		'create price => pdv:[%s] id:{%s} nom:%s maj:[%s] prix:%s',
		currentPdv.id,
		id,
		name,
		datetime,
		value
	)

	var price = new Price({
		id: id,
		name: name,
		pdv: currentPdv.id,
		prices: [
			{
				date: datetime,
				value: value
			}
		]
	})
	price
		.save()
		.then(() => {
			readNextPrice()
		})
		.catch(e => console.error('Erreur sur la creation de prix : ', e))
}

const stop = function(where = 'not determined') {
	console.log('STOP PROGRAMME ! (%s)', where)
	process.exit(0)
}

//Promise.all([User.save(), blabla.save()]).then(() => {

//User.findOne({name: 'balbal'}).populate('brand').then ((user) => {})

/*User.findOne({ name: 'balbal' })
	.populate({
		path: 'horaires',
		populate: {
			path: 'times',
			model: 'time'
		}
	})
	.then(user => {})*/
