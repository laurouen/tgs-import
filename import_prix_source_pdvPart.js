const mongoose = require('mongoose')
const fs = require('fs')
const Pdv = require('./src/Pdv')
//const Service = require('./src/service')

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

let index = 0
let pdvs = []
let incCreatePdv = 0,
	incUpdatePdv = 0,
	incUpdateLocOnly = 0

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
	if (index > pdvs.length) {
		console.log('nb d enregistrements : ', pdvs.length)
		console.log('nb de pdv créé : ', incCreatePdv)
		console.log('nb de pdv mis à jour : ', incUpdatePdv)
		console.log('nb loc update only : ', incUpdateLocOnly)
		stop('Fin d import !')
	}
	if (pdvs[index]) {
		updatePdv(pdvs[index++])
	} else {
		index++
		readNextPdvs()
	}
}

const updatePdv = function(updPdv) {
	let {
		id,
		latitude,
		longitude,
		cp,
		pop,
		adresse,
		ville,
		horaires,
		services
	} = updPdv

	if (ville instanceof Object) {
		ville = 'notDefined'
	}

	//manage Services
	if (services) {
		services = services.service
	}
	if (services == undefined) {
		services = []
	}
	for (
		let indexServices = 0;
		indexServices < services.length;
		indexServices++
	) {
		let data = services[indexServices]
		let reg = / é /gi
		services[indexServices] = data.replace(reg, ' à ')
	}

	let schedule = []
	let inactive = true
	let automate2424 = false

	//determine schedule && inactive && automate2424
	if (horaires == undefined) {
		inactive = true
	} else {
		// horaires up

		if (horaires['automate-24-24'] == undefined) {
			horaires['automate-24-24'] = ''
		}

		automate2424 = horaires['automate-24-24'] == '1' ? true : false
		const horairesJours = horaires.jour

		for (let jourIndex = 0; jourIndex < 7; jourIndex++) {
			const jour = horairesJours[jourIndex]
			inactive = inactive && jour.ferme === '1'
			let times = []
			let horaire = jour.horaire
			if (horaire == undefined) {
				//do nothing
			} else if (horaire instanceof Array) {
				for (
					let horairesIndex = 0;
					horairesIndex < horaire.length;
					horairesIndex++
				) {
					const h = horaire[horairesIndex]
					times.push({
						opening: h.ouverture,
						closing: h.fermeture
					})
				}
			} else if (horaire instanceof Object) {
				times.push({
					opening: horaire.ouverture,
					closing: horaire.fermeture
				})
			}
			schedule.push({
				jour: jour.nom,
				active: jour.ferme === '',
				times: times
			})
		}
	}
	//if no horaires were setted, consider to be active
	if (schedule.length == 0 && latitude != 0) {
		automate2424 = true
		inactive = false
	}

	console.log(
		'update pdv => [%s] {%s} %s  [%s](%s)',
		inactive ? '0' : '1',
		id,
		adresse,
		cp,
		ville
	)

	Pdv.findOne({ id: id }, (err, getPdv) => {
		if (err) {
			console.error('Erreur updating Pdv : ', err)
			stop('Erreur update: id = %s', id)
		}

		if (getPdv == null) {
			incCreatePdv++
			//create Pdv without brand
			getPdv = new Pdv({
				id: id,
				latitude: parseCoordinate(latitude),
				longitude: parseCoordinate(longitude),
				loc: [parseCoordinate(longitude), parseCoordinate(latitude)],
				adresse: adresse,
				cp: cp,
				ville: ville,
				pop: pop === 'A' ? 'A' : 'R',
				automate2424: automate2424,
				active: !inactive,
				schedule: schedule,
				services: services
			})
		} else {
			incUpdatePdv++
			if (getPdv.latitude == 0) {
				incUpdateLocOnly++
				getPdv.latitude = parseCoordinate(latitude)
				getPdv.longitude = parseCoordinate(longitude)
				getPdv.loc = [parseCoordinate(longitude), parseCoordinate(latitude)]
			}
			getPdv.adresse = adresse
			getPdv.cp = cp
			getPdv.ville = ville
			getPdv.pop = pop === 'A' ? 'A' : 'R'
			getPdv.automate2424 = automate2424
			getPdv.active = !inactive
			getPdv.schedule = schedule
			getPdv.services = services
		}

		getPdv
			.save()
			.then(() => {
				readNextPdvs()
			})
			.catch(e => console.error('Error when updating Pdv : %s ', id, e))
	})
}

const parseCoordinate = function(coordinate) {
	return parseFloat(coordinate, 12) / 100000
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
