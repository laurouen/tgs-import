const parser = require('xml2json')
const fs = require('fs')

fs.readFile('PrixCarburants_instantane.xml', 'latin1', (err, data) => {
	if (err || data == undefined) {
		console.log('error dreadng file :', err)
	}
	//console.log(data)
	/*
	let reg = /È/gi
	data = data.replace(reg, 'è')
	reg = /Á/gi
	data = data.replace(reg, 'ç')
	reg = /‡/gi
	data = data.replace(reg, 'à')
	reg = /…/gi
	data = data.replace(reg, 'é')
	reg = /Á/gi
	data = data.replace(reg, 'ç')*/

	var json = parser.toJson(data)
	fs.writeFile('prix_source.json', json, err => {
		console.log('Successfully Written to File.')
	})
})
