const mongoose = require('mongoose')
const fs = require('fs')
const Pdv = require('./src/Pdv')
const source = 'archives/pdv_source20190602.json'
//const source = 'archives/pdv_source20190608.json'

let index = 0
let pdvs = []
let brandCache = {}
let create = 0

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

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
	fs.readFile(source, 'utf-8', (err, pdvsFromFile) => {
		if (err) {
			console.log('Erreur lecture fichier : ', err)
			stop()
		}
		pdvs = JSON.parse(pdvsFromFile)
		setTimeout(function() {
			readNextPdvs()
		}, 2000)
	})
}

const readNextPdvs = function() {
	if (index > pdvs.length) {
		console.log('nb d enregistrements : ', pdvs.length)
		console.log('nb de nouveaux PDVs : ', create)
		stop('Fin d import !')
	}
	if (pdvs[index] && pdvs[index].fields) {
		const { id, brand, name, geo_point } = pdvs[index].fields
		let lat = 0,
			long = 0
		if (pdvs[index].geometry) {
			const { coordinates } = pdvs[index].geometry
			if (coordinates instanceof Array && coordinates.length == 2) {
				lat = coordinates[1]
				long = coordinates[0]
			}
		} else {
			if (
				geo_point != undefined &&
				geo_point instanceof Array &&
				geo_point.length == 2
			) {
				lat = geo_point[0]
				long = geo_point[1]
			}
		}
		index++
		//findBrand(brand, id, name)
		findPdv(id, name, brand, lat, long)
	} else {
		index++
		readNextPdvs()
	}
}

const findBrand = function(brandName, pdvId, pdvName) {
	if (brandCache[brandName]) {
		findPdv(pdvId, pdvName, brandCache[brandName])
	} else {
		Brand.findOne({ name: brandName }, function(err, getBrand) {
			if (err) {
				console.error(
					'Erreur lors de la recherche de Brand  : ',
					brandName,
					err
				)
				stop('recherche brand : failed')
			}
			if (getBrand == null) {
				//create Brand
				createBrand(brandName, pdvId, pdvName)
			} else {
				//use Brand
				brandCache[getBrand.name] = getBrand
				findPdv(pdvId, pdvName, getBrand)
			}
		})
	}
}

const createBrand = function(brandName, pdvId, pdvName) {
	brandName = brandName ? brandName : 'notDefined'
	const newBrand = new Brand({
		name: brandName
	})
	console.log('new brand => ', brandName)
	newBrand
		.save()
		.then(() => {
			findBrand(brandName, pdvId, pdvName)
		})
		.catch(e => {
			if (e.code === 11000) {
				console.log('catchDuplicate ', brandName)
				findBrand(brandName, pdvId, pdvName)
			} else {
				console.error(
					'Erreur lors de la creation d un Brand (%s) (%s) : ',
					pdvId,
					brandName ? brandName : 'BrandnotDefined',
					e
				)
			}
		})
}

const findPdv = function(pdvId, pdvName, brand, lat, long) {
	Pdv.findOne({ id: pdvId }, function(err, getPdv) {
		if (err) {
			console.error('Erreur lors de la recherche de pdv  : ', pdvid, err)
			stop('recherche pdv : failed')
		}
		if (getPdv == null) {
			//create pdv
			createPdv(pdvId, pdvName, brand, lat, long)
		} else {
			//loop
			console.log('%s => next', pdvId)
			readNextPdvs()
		}
	})
}

const createPdv = function(id, name, brand, lat, long) {
	name = name ? name : 'notDefined'
	brand = brand ? brand : 'notDefined' //tobe removed when adding brand document
	let newPdv = new Pdv({
		id: id,
		name: name,
		brand: brand,
		latitude: parseFloat(lat, 12),
		longitude: parseFloat(long, 12),
		loc: [parseFloat(long, 12), parseFloat(lat, 12)]
	})
	console.log('new pdv => {%s} %s  (%s)', id, name, brand)
	newPdv
		.save()
		.then(() => {
			//ok
			create++
			readNextPdvs()
		})
		.catch(e => console.error('Erreur sauvegarde Pdv : ', e))
}

const stop = function(where = 'not determined') {
	console.log('STOP PROGRAMME ! (%s)', where)
	process.exit(0)
}
