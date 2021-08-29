
require('dotenv').config();
const fs = require('fs');
const util = require('util')
const DB = require('./lib/db/postgres');
const Tasmota = require('./lib/plug_ctl/tasmota');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const PORT = process.env.Multicast_Port || 1233;
const HOST = process.env.Multicast_Host || '192.168.0.80';

let Controler_Cache = []
let LastDataTime = 0;
let DataNow = false;
let FrameCounter = 0;

server.on('listening', function() {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ':' + address.port);
});

server.on('message', function(message, remote) {
	var LLT = Object.values(message);
	var buf = Buffer.from(LLT); 

	FrameCounter++;

    //Need to check if no undefined here.
	Controler_Cache.map(Controler => {
		if(Controler.mode === "RGB" || process.env.Multicast_ModeOverride === "true"){
			//console.log("Send to: " + Controler.rgbcontrolerip)
			server.send(buf, 0, buf.length, 1234, Controler.rgbcontrolerip, function(err, bytes) {
				if (err) throw err;
			});
		}
	})
	LastDataTime = new Date().getTime()
	if(DataNow === false){
		Controler_Cache.map(Controler => {
			if(Controler.mode === "RGB" && Controler.state === false || Controler.state === "false"){
				console.log(`Send ON Event to: (${Controler.controlerid}) ${Controler.name}`)
				Tasmota.SwitchPlugPower(Controler.controlerid, true)
			}
		})
		DataNow = true
	}
});
setInterval(function(){
	ConstantRun();
}, process.env.Multicast_RefreshInterval || 5000);

if(process.env.Multicast_Log_FPS === "true"){
	setInterval(function(){
		if(FrameCounter > 0){
			console.log(`FPS: ${FrameCounter} - MS: ${(1000/FrameCounter).toFixed(2)}`)
			FrameCounter = 0;
		}
	}, 1000);
}

function ConstantRun(){
	DB.get.controler.AllWithPlugState().then(function(Controlers) {
		Controler_Cache = Controlers.rows
		if(new Date().getTime() - LastDataTime >= 5000 && DataNow === true){
			Controler_Cache.map(Controler => {
				if(Controler.mode === "RGB" && Controler.state === true || Controler.state === "true"){
					console.log(`Send OFF Event to: (${Controler.controlerid}) ${Controler.name}`)
					Tasmota.SwitchPlugPower(Controler.controlerid, false)
				}
			})
			DataNow = false
		}
	});
}

ConstantRun();
server.bind(PORT, HOST);
 
 