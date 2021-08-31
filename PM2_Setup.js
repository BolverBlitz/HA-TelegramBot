const pm2 = require('pm2')

pm2.connect(function(err) {
  if (err) {
    console.error(err)
    process.exit(2)
  }
  
  Promise.all([newPM2_Instance('./index.js', 'HA-Bot'), newPM2_Instance('./Multicastv2.js', 'RGB-Proxy')]).then((values) => {
    pm2.list((err, list) => {
      list.map(Instance => {
        console.log(`Started ${Instance.name} with status ${Instance.pm2_env.status}`)
      })
        pm2.disconnect()
        process.exit(2)
    })
  });
})

function newPM2_Instance(app, name){
    return new Promise(function(resolve, reject) {
        pm2.start({
            script    : app,
            name      : name
        }, function(err, apps) {
            if (err) {
                console.error(err)
                reject(err)
            }
            resolve(apps)
        })
    });
}