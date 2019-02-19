// Import required libraries
require(__dirname + '/Resources/config.js');
require('./packet.js');
var fs = require('fs'); 	// file system
var net = require('net');	// websockets


// Load initializers
var init_files = fs.readdirSync(__dirname + "/Initializers");
init_files.forEach(function(initFile){
	console.log('Loading Initializer: ' + initFile);
	require(__dirname + "/Initializers/" + initFile);
});

// Load models
var model_files = fs.readdirSync(__dirname + "/Models");
model_files.forEach(function(modelFile){
	console.log('Loading Model: ' + modelFile);
	require(__dirname + "/Models/" + modelFile);
});

// Load enemies
enemies = {};
var enemy_files = fs.readdirSync(config.data_paths.enemies);
enemy_files.forEach(function(enemyFile){
	console.log('Loading Enemy: ' + enemyFile);
	var enemy = require(config.data_paths.enemies + enemyFile);
	enemies[enemy.name] = enemy;
});

// Load maps
maps = {};
var map_files = fs.readdirSync(config.data_paths.maps);
map_files.forEach(function(mapFile){
	console.log('Loading Map: ' + mapFile);
	var map = require(config.data_paths.maps + mapFile);
	maps[map.room] = map;
	maps[map.room].enemies.forEach(function(enemy){
		enemy["stats"]["asset"] = enemies[enemy.name].stats["asset"];
		enemy["stats"]["type"] = enemies[enemy.name].stats["type"];
		enemy["stats"]["respawn"] = enemies[enemy.name].stats["respawn"];
		enemy["stats"]["hp"] = enemies[enemy.name].stats["hp"];
		enemy["stats"]["maxhp"] = enemies[enemy.name].stats["maxhp"];
		enemy["stats"]["target"] = enemies[enemy.name].stats["target"];
		enemy["stats"]["expr"] = enemies[enemy.name].stats["expr"];
	});
});

// Flag all users as loged out before starting server
var query = { in_game: true }; // get users who are still flagged as logged in
User.update(query, { in_game: false }, {multi: true}, function(err, status){
	if(err){
		console.err('Error! '+err);
	}
	console.log('status: '+JSON.stringify(status));
});


///// UDP SERVER /////

const dgram = require('dgram');
udp_server = dgram.createSocket('udp4');

// testing
udp_server.count = 0;

// abbreviate send function for easier use
udp_server.send_udp = function(buffer, address){
	this.send(buffer, 0, buffer.length, address.port, address.address, function(err, bytes){
		if(err){
			console.err('Error: '+err);
		}
	});
}
// get a client based on the address of incoming data
udp_server.get_client = function(address, cb){
	this.clients.forEach(function(c){
		if(c.address.address == address.address && c.address.port == address.port){
			cb(c);
		}
	});
	return
}

udp_server.on('listening', function(){
  var address = udp_server.address();
  console.log('Initialize complete, UDP Server listening '+address.address+':'+address.port);
});

udp_server.on('message', function(data, address){
  console.log('server got: '+data+' from '+address.address+':'+address.port);
  // count up the paket we got
  udp_server.count += 1;
  console.log('COUNT: '+udp_server.count);
 
  // parse the incoming data
  packet.interpret_udp(udp_server, address, data);
});

udp_server.on('error', function(err){
  console.log('Server error:\n'+err.stack);
  server.close();
});

udp_server.on('close', function(){
	console.log('Socket closed :(');

});

udp_server.bind(61954);


////// TCP SERVER //////

//Start listening to clients
net.createServer(function(socket){

  socket.setNoDelay(true); // disable nagle buffering
	console.log("Client connected:" );
	console.log("Remote IP: "+socket.remoteAddress);
	
	var c_inst = new require('./client.js');
	var thisClient = new c_inst();

	thisClient.socket = socket;
	thisClient.initiate();

	socket.on('error', thisClient.error);

	socket.on('end', thisClient.end);

	socket.on('data', thisClient.data);


}).listen(config.port);

console.log("Initialize completed, TCP Server running on port: " 
				+ config.port +" for environment: " + config.environment);