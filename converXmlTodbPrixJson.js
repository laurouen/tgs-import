const parser = require('xml2json')
const fs = require('fs')

fs.readFile('PrixCarburants_instantane.xml', 'latin1', (err, data) => {
	if (err || data == undefined) {
		console.log('error reading file :', err)
	}

	var json = parser.toJson(data)
	fs.writeFile('prix_source.json', json, err => {
		console.log('Successfully Written to File.')
	})
})
