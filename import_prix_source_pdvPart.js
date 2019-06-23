const pathBase = '/home/tgs/import/'
const mongoose = require('mongoose')
const fs = require('fs')
const Pdv = require(pathBase + 'src/Pdv')
const source = pathBase + 'cron_archives/prix_source.json'
//const source = 'archives/prix_source20190606.json'
//const source = 'archives/prix_source20190613.json'

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

let index = 0
let pdvs = []

let incUpLat = 0
let incUpLong = 0
let incUpAdr = 0
let incUpCp = 0
let incUpVill = 0
let incUpPop = 0
let incUpAuto = 0
let incUpActiv = 0

let incCreatePdv = 0,
	incUpdatePdv = 0,
	incUpdateLocOnly = 0


	

mongoose.connect('mongodb://localhost/Essence', {
	useCreateIndex: true,
	useNewUrlParser: true
})


var callback = console.log

/*
	mongoose.connection
		.once('open', () => {
			console.log('----------------------------')
			console.log('!!   Connexion établie    !!')
			console.log('----------------------------')

			readSource()
		})
		.on('error', error => console.log('Erreur de connexion : ', error))
*/

const readSource = function() {
	fs.readFile(source, 'utf-8', (err, pdvsFromFile) => {
		if (err) {
			console.error(err, source)
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

const startImportPrixPdvs = function (_callback) {
	callback = _callback
	readSource()
}

const readNextPdvs = function() {
	if (index > pdvs.length) {
		var rapport = 'nb d enregistrements : ' + pdvs.length
		rapport += ' ; nb de pdv créé : ' + incCreatePdv
		rapport += ' ; nb de pdv mis à jour : ' + incUpdatePdv
		rapport += ' ; nb loc update only : ' + incUpdateLocOnly
		rapport += ' ; update causes : '
		rapport += 'lat(' + incUpLat + ')'
		rapport += 'long(' + incUpLong + ')'
		rapport += 'adr(' + incUpAdr + ')'
		rapport += 'cp(' + incUpCp + ')'
		rapport += 'vil(' + incUpVill + ')'
		rapport += 'pop(' + incUpPop + ')'
		rapport += 'auto(' + incUpAuto + ')'
		rapport += 'activ(' + incUpActiv + ')'
		callback(rapport)
	}
	else if (pdvs[index]) {
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

		let flagFillTimesOneTime = false
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
					if (h && h.ouverture) {
						flagFillTimesOneTime = true
						times.push({
							opening: h.ouverture,
							closing: h.fermeture
						})
					}
				}
			} else if (horaire instanceof Object && horaire.ouverture) {
				flagFillTimesOneTime = true
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
		if (!flagFillTimesOneTime) {
			automate2424 = true
		}
	}
	//if no horaires were setted, consider to be active
	if (schedule.length == 0 && latitude != 0) {
		automate2424 = true
		inactive = false
	}

	Pdv.findOne({ id: id }, (err, getPdv) => {
		if (err) {
			callback('Erreur updating Pdv : ', err)
			stop('Erreur update: id = %s', id)
		}

		const newPdv = new Pdv({
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
		var isEqual = false
		if (getPdv == null) {
			incCreatePdv++
			//create Pdv without brand
			getPdv = newPdv
		} else {
			if (haveEgality(getPdv, newPdv)) {
				isEqual = true
			}
			else {

				if (getPdv.latitude == 0 && newPdv.latitude != 0) {
					incUpdateLocOnly++
				}

				if (newPdv.latitude != 0) {
					getPdv.latitude = newPdv.latitude
					if (newPdv.longitude != 0) {
						getPdv.longitude = newPdv.longitude
					}
					getPdv.loc = [getPdv.longitude, getPdv.latitude]
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
		}

		if (isEqual) {
			readNextPdvs()
		}
		else {
			incUpdatePdv++
				console.log(
					'update pdv => [%s] {%s} %s  [%s](%s)',
					inactive ? '0' : '1',
					id,
					adresse,
					cp,
					ville
				)
			getPdv
				.save()
				.then(() => {
					readNextPdvs()
				})
				.catch(e => {
					callback('Error when updating Pdv : %s ', id, e)
					stop()
				})
		}
	})
}


const haveEgality = function(oldPdv, newPdv) {
	var isEqual = true
	if (oldPdv.latitude !== newPdv.latitude) {
		isEqual = false
		incUpLat++
	}
	if (oldPdv.longitude !== newPdv.longitude) {
		isEqual = false
		incUpLong++
	}
	if (oldPdv.adresse !== newPdv.adresse) {
		isEqual = false
		incUpAdr++
	}
	if (oldPdv.cp !== newPdv.cp) {
		isEqual = false
		incUpCp++
	}
	if (oldPdv.ville !== newPdv.ville) {
		isEqual = false
		incUpVill++
	}
	if (oldPdv.pop !== newPdv.pop) {
		isEqual = false
		incUpPop++
	}
	if (oldPdv.automate2424 !== newPdv.automate2424) {
		isEqual = false
		incUpAuto++
	}
	if (oldPdv.active !== newPdv.active) {
		isEqual = false
		incUpActiv++
	}
	return isEqual
}

const parseCoordinate = function(coordinate) {
	return parseFloat(coordinate, 12) / 100000
}

const stop = function(where = 'not determined') {
	console.log('STOP PROGRAMME (PDV) ! (%s)', where)
	process.exit(0)
}


module.exports = startImportPrixPdvs
