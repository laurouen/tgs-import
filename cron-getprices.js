const exec = require('child_process').exec;
const unzip = require('unzipper')
const parser = require('xml2json')
const fs = require('fs')

const fileName = 'PrixCarburants_instantane'
const zipExtension = '.zip'
const path = '/home/tgs/import/cron_archives/'
const xmlExtension = '.xml'
const url = 'https://donnees.roulez-eco.fr/opendata/instantane'

var cmd = 'wget -q ' + url + ' -O ' + path + fileName + zipExtension;
var child = exec(
    cmd,
    function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        else {
            console.log('curl ok -> unzip ', stdout, stderr)
            unzip.Open.file(path + fileName + zipExtension)
            .then(d => {
                d.extract({path: path})
                .then(() => {
                    console.log("unzip ok => xml2json")
                    fs.readFile(path + fileName + xmlExtension, 'utf8', (err, data) => {
                        if (err || data == undefined) {
                            console.log('error reading file :', err)
                        }
                    
                        var json = parser.toJson(data)
                        fs.writeFile(path + 'prix_source.json', json, err => {
                            console.log('xml2json ok => log import into database')
                        })
                    })
                    
                })
            })
        }
    }
  );
  