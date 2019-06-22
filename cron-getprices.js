const exec = require('child_process').exec;
const unzip = require('unzipper')
const parser = require('xml2json')
const fs = require('fs')
const mongoose = require('mongoose')
const LogImport = require('./src/LogImport')

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

var cmd = 'wget -q ' + url + ' -O ' + path + fileName + zipExtension;
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
                            let newLog = new LogImport({
                                name: "Prices"
                            })
                            newLog
                                .save()
                                .then(() => {
                                    console.log('log Import ok => importPdvSource')
                                })
                                .catch(e => console.error('Error save LogImport : ', e))
                        })
                    })
                    
                })
            })
        }
    }
  );
  