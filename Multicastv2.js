var PORT = 1233;
 var HOST = '192.168.65.158';
 
 var PORTSend = 1234
 var HOSTSend = '192.168.0.210'
 
 var PORTSend2 = 1234
 var HOSTSend2 = '192.168.0.211'

 var PORTSend3 = 1234
 var HOSTSend3 = '192.168.0.212'

 var dgram = require('dgram');
 var server = dgram.createSocket('udp4');
 var sum = 0;
 var Ausschlag;
 
 function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

 server.on('listening', function() {
     var address = server.address();
     console.log('UDP Server listening on ' + address.address + ':' + address.port);
 });

 server.on('message', function(message, remote) {
     var Payload = Array.from(message);
	 var LLT = Object.values(message);
	 var buf = Buffer.from(LLT); 
	 var Hight = "";

	 
	 for (var i = 0; i < LLT.length; i++) {
		sum += LLT[i]
	}
	//let AusschlagNUM = Math.floor((sum-26530)/1000) //-26530 Für 12% Weiß
	let AusschlagNUM = Math.floor((sum-13000)/1000) //Colore -12000
	for (var i = 0; i < AusschlagNUM; i++) {
		Ausschlag = Ausschlag + ".";
	}
	console.log(Ausschlag)
	 sum = 0;
	 Ausschlag = "";
	 

    //Need to check if no undefined here.
	server.send(buf, 0, buf.length, PORTSend3, HOSTSend3, function(err, bytes) {
		if (err) throw err;
	});
	server.send(buf, 0, buf.length, PORTSend2, HOSTSend2, function(err, bytes) {
		if (err) throw err;
	});
	server.send(buf, 0, buf.length, PORTSend, HOSTSend, function(err, bytes) {
		if (err) throw err;
	});
 });

 server.bind(PORT, HOST);