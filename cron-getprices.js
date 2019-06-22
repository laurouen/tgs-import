const Path = require('path')  
const Axios = require('axios')
let fs = require('fs')
//const urlFuelPricesZipFile = 'https://donnees.roulez-eco.fr/opendata/instantane'
let zipFileDesitnation = 'cron_archives/last_imported_prices.zip'



async function downloadImage () {  
    const path = Path.resolve(__dirname, 'cron_archives', 'PrixCarburants_instantane.zip')
  const writer = fs.createWriteStream(path)

  const response = await Axios({
    url: 'https://donnees.roulez-eco.fr/opendata/instantane',
    method: 'GET',
    responseType: 'arraybuffer'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

downloadImage()  