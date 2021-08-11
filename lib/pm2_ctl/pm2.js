const pm2 = require('pm2')

let GetPM2IDByName = function(NameList) {
    return new Promise(function(resolve, reject) {
        pm2.connect(function(err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }
          
            pm2.list((err, list) => {
                reject(err);
                let Filterd = list.filter(x => NameList.includes(x));
                
                console.log(Filterd.length)
                Filterd.map(Data => {
                    console.log(Data)
                })
            })
        })
    });
}

module.exports = {
    GetPM2IDByName
};
