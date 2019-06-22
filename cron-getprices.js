const exec = require('child_process').exec;
const unzip = require('unzipper')
const parser = require('xml2json')
const fs = require('fs')
const mongoose = require('mongoose')
const Logimport = require('./src/LogImport')
const startImportPrixPdvs = require('./import_prix_source_pdvPart')

const fileName = 'PrixCarburants_instantane'
const zipExtension = '.zip'
const path = '/home/tgs/import/cron_archives/'
const xmlExtension = '.xml'
const url = 'https://donnees.roulez-eco.fr/opendata/instantane'


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

    startImport()
})
.on('error', error => console.log('Erreur de connexion : ', error))


var cmd = 'wget -q ' + url + ' -O ' + path + fileName + zipExtension;

const startImport = function () {
    var child = exec(
        cmd,
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            else {
                console.log('curl ok -> unzip ')
                unzip.Open.file(path + fileName + zipExtension)
                .then(d => {
                    d.extract({path: path})
                    .then(() => {
                        console.log("unzip ok => xml2json")
                        fs.readFile(path + fileName + xmlExtension, 'latin1', (err, data) => {
                            if (err || data == undefined) {
                                console.log('error reading file :', err)
                            }
                        
                            var json = parser.toJson(data)
                            fs.writeFile(path + 'prix_source.json', json, err => {
                                console.log('xml2json ok => log import into database')
                                let newLog = new Logimport({
                                    name: "Prices"
                                })
                                newLog
                                    .save()
                                    .then(() => {
                                        console.log('log Import ok => importPdvSource')
                                        startImportPrixPdvs()
                                    })
                                    .catch(e => console.error('Error save LogImport : ', e))
                            })
                        })
                        
                    })
                })
            }
        }
    )
}
  const stop = function(where = 'not determined') {
	console.log('STOP PROGRAMME ! (%s)', where)
	process.exit(0)
}