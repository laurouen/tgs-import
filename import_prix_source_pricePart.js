const pathBase = '/home/tgs/import/'
const mongoose = require('mongoose')
const fs = require('fs')
const Price = require(pathBase + 'src/Price')
const Pdv = require(pathBase + 'src/Pdv')
const source = pathBase + 'cron_archives/prix_source.json'
//const source = 'archives/prix_source20190602.json'
//const source = 'archives/prix_source20190606.json'
//const source = 'archives/prix_source20190613.json'

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

let indexPdv = 0
let indexPrices = 0
let pdvs = []
let currentPdv = null
let prices = []
let incCreatePrice = 0
let incUpdatePrice = 0
let incRemovePrice = 0

/*
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
*/

var callback = console.log

const startImportPrixPrice = function (_callback) {
	callback = _callback
	readSource()
}

const readSource = function() {
	fs.readFile(source, 'utf-8', (err, pdvsFromFile) => {
		if (err) {
			callback('Erreur lecture fichier : ', err)
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
		var rapport = 'nb d enregistrements : ' + pdvs.length
		rapport += ' ; nb prix créés : ' + incCreatePrice
		rapport += ' ; nb prix updaté : ' + incUpdatePrice
		rapport += ' ; nb remove price : ' + incRemovePrice
		callback(rapport)
	}
	else if (pdvs[indexPdv]) {
		//console.log('next Pdv :', indexPdv)
		currentPdv = pdvs[indexPdv++]
		Pdv.findOne({ id: currentPdv.id }, function(err, getPdv) {
			if (err) {
				callback(
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
	/*console.log(
		'looking for price : price.id:%s and pdv:%s ',
		price.id,
		currentPdv.id
	)*/
	let { id, valeur, nom, maj } = price
	Price.findOne({ pdv: currentPdv.id, id: id }, function(err, getPrice) {
		if (err) {
			callback(
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
			
			let needToAdd = true
			for (let index = 0; index < getPrice.prices.length; index++) {
				const p = getPrice.prices[index]
				if (p.date === maj) {
					needToAdd = false
				}
			}

			if (needToAdd) {
				incUpdatePrice++
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
					incRemovePrice++
					getPrice = removeOldestPrice(getPrice)
				}

				getPrice
					.save()
					.then(() => readNextPrice())
					.catch(e => {
						callback('Update failed : ', e)
						stop()
					})
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
		.catch(e => {
			callback('Erreur sur la creation de prix : ', e)
			stop()
		})
}

const stop = function(where = 'not determined') {
	console.log('STOP PROGRAMME ! (%s)', where)
	process.exit(0)
}



module.exports = startImportPrixPrice