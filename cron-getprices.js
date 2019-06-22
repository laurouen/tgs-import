var cmd = 'wget -q https://donnees.roulez-eco.fr/opendata/instantane -O /home/tgs/import/cron_archives/PrixCarburants_instantane.zip';
var child = exec(cmd, function(err) {
  console.log('DONE');
});