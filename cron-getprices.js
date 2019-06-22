var exec = require('child_process').exec;

const fileName = 'PrixCarburants_instantane'
const zipExtension = '.zip'
const path = '/home/tgs/import/cron_archives/' + fileName + zipExtension
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
            console.log('ok -> unzip')
            unzip.Open.file(path + fileName + zipExtension)
            .then(d => {
                d.extract({path: path + fileName + xmlExtension})
                .then(r => console.log("ok ", r))
            })
        }
    }
  );
  