const FritzBoxAPI = require('fritzapi').Fritz;
const { writeDatapoint } = require('../lib/influx');

const f = new FritzBoxAPI(process.env.FritzAPI_UserName, process.env.FritzAPI_Password, process.env.FritzAPI_Host);

function sequence(promises) {
  var result = Promise.resolve();
  promises.forEach(function (promise, i) {
    result = result.then(promise);
  });
  return result;
}

const writeSwichStats = async (ain) => {
  const power = await f.getSwitchPower(ain);
  const energy = await f.getSwitchEnergy(ain);
  const temp = await f.getTemperature(ain);
  const data = {
    power: power,
    energy: energy,
    temp: temp,
  };
  writeDatapoint("FritzSwitch", data, ain);
}

setInterval(async () => {
  f.getSwitchList().then(function (ains) {
    sequence(ains.map(writeSwichStats));
  });
}, process.env.FritzAPI_Interval);

module.exports = {
  StartText: "FritzBox API"
}