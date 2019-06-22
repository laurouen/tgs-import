var exec = require('child_process').exec;

var cmd = 'wget -q https://donnees.roulez-eco.fr/opendata/instantane -O /home/tgs/import/cron_archives/PrixCarburants_instantane.zip';
var child = exec(
    cmd,
    function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        else {
            console.log('ok -> unzip')
        }
    }
  );
  