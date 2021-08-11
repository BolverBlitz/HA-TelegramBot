const request = require("request");
const ping = require('ping');
const DB = require('../db/postgres');

function getAllIndexes(arr, val) {
    var indexes = [], i = -1;
    while ((i = arr.indexOf(val, i+1)) != -1){
        indexes.push(i);
    }
    return indexes;
  }

/**
 * This function will get the power data and status of a plug by plug ID
 * @returns Array
 */
let UpdatePlugPower = function(PlugID) {
    return new Promise(function(resolve, reject) {
        DB.get.plugs.ByID(PlugID).then(function(Plug) {
            ping.sys.probe(Plug[0].ipaddr, function(isAlive){
                if(isAlive){
                  try{
                    request(`http://${Plug[0].ipaddr}/?m=1`, { json: true }, (err, res, body) => {
                      let out_arr = []; 
                      if(body){
                        let start_arr = getAllIndexes(body, '{m}');
                        let stop_arr = getAllIndexes(body, '{e}');
                        let end_arr = getAllIndexes(body, '{t}');
                        for (i = 0; i < start_arr.length; i++) {
                          out_arr.push(body.substr(start_arr[i]+3, stop_arr[i]-start_arr[i]-3))
                        }
                        DB.update.plugs.UpdatePower(PlugID, parseInt(out_arr[2].replace(/\D/g,'')), parseInt(out_arr[8].replace(/\D/g,'')), body.substr(end_arr[1]+3, body.length).replace(/<[^>]*>?/gm, '')).then(function(Plug) {
                            resolve("Updated")
                        });
                      }else{
                        resolve("Offline: No Body")
                      }
                    });
                  } catch (error) {
                    resolve("Offline: Request Failed")
                  }
                }else{
                    resolve("Offline: No Ping Response")
                }
            });
        }).catch(error => reject(error));
    });
}

/**
 * This function will get the power data and status of a plug by plug ID
 * @returns Array
 */
 let SwitchPlugPower = function(PlugID, state) {
    return new Promise(function(resolve, reject) {
        DB.get.plugs.ByID(PlugID).then(function(Plug) {
            if(Plug[0].state_switch_allowed){
                ping.sys.probe(Plug[0].ipaddr, function(isAlive){
                    if(isAlive){
                        let NewToggle;
                        if(state === "true" || state === true){
                            NewToggle = "On"
                        }else{
                            NewToggle = "off"
                        }
                        request(`http://${Plug[0].ipaddr}/cm?cmnd=Power%20${NewToggle}`, { json: true }, (err, res, body) => {
                            if(body){
                                let NewState;
                                if(body.POWER === "OFF"){
                                    NewState = false
                                }else{
                                    NewState = true
                                }
                                DB.update.plugs.UpdateState(PlugID, NewState).then(function(DB_Update_Response) {
                                    resolve(body.POWER)
                                });
                            }else{
                                resolve("Offline: No Body")
                            }
                        });
                        try{
                        }catch (error) {
                            resolve("Offline: Request Failed")
                        }
                    }else{
                        resolve("Offline: No Ping Response")
                    }
                });
            }else{
                resolve("Not_allowed")
            }
        }).catch(error => reject(error));
    });
}

 module.exports = {
    UpdatePlugPower,
    SwitchPlugPower
};
