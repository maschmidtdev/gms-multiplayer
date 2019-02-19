var zeroBuffer = new Buffer('00', 'hex');
var _ = require('underscore');

module.exports = packet = {

 	build: function(params){

		var packetParts = [];
		var packetSize = 0;

		params.forEach(function(param){
			var buffer;

			if(typeof param === 'string'){
				buffer = new Buffer(param, 'utf8');
				buffer = Buffer.concat([buffer, zeroBuffer], buffer.length +1);
			}else if(typeof param === 'number'){
				buffer = new Buffer(2);
				console.log('Param: ' + param);
				if(param >= 0){
					try{
						buffer.writeUInt16LE(param, 0);
						//buffer.writeUInt8(param, 0);
					}catch(e){
						console.log("buffer.writeUInt16LE Error: " + e);
					}
				} else {					
					try{
						buffer.writeInt16LE(param, 0);
						//buffer.writeUInt8(param, 0);
					}catch(e){
						console.log("buffer.writeInt16LE Error: " + e);
					}
				}
			}else{
				console.log("WARNING: Unknown data type in packet builder!");
				console.log("param = "+ typeof param);
			}

			packetSize += buffer.length;
			packetParts.push(buffer);

		});

		var dataBuffer = Buffer.concat(packetParts, packetSize);

		var size = new Buffer(1);
		size.writeUInt8(dataBuffer.length +1, 0);

		var finalPacket = Buffer.concat([size, dataBuffer], size.length + dataBuffer.length);

		return finalPacket;
	},

	// Parse a packet to be handled for client
	parse: function(client, data){

		var idx = 0; // Index in the buffer
	
		while(idx < data.length){

			var packetSize = data.readUInt8(idx);
			var extractedPackt = new Buffer(packetSize);
			data.copy(extractedPackt, 0, idx, idx + packetSize);

			this.interpret(client, extractedPackt);

			idx += packetSize;

		}
	},

	// Parse a UDP packet to be handled for client
	parse_udp: function(server, address, data){

		/*var idx = 0; // Index in the buffer
	
		while(idx < data.length){


			var packetSize = data.readUInt8(idx);
			var extractedPackt = new Buffer(packetSize);
			data.copy(extractedPackt, 0, idx, idx + packetSize);

			this.interpret_udp(server, address, extractedPackt);

			idx += packetSize;

		}*/

		this.interpret_udp(server, address, data);
	},

	interpret: function(client, datapacket){

		var header = PacketModels.command.parse(datapacket);
		var command = header.command.toUpperCase();

		// Exclude some command logs to avoid cluttering the console
    	if(command != "PING" && command != "POS" && command != "PING" && command != "SPRITE" && command != "DASH"
    		&& command != "IDLE" && command != "ATTACK" && command != "ENEMY POS" && command != "FACE"){
		//if(command != "PING"){
			//console.log("Interpret: " + command);	
		}

		switch(command){

			case "PING":
				// Send ping back
				client.socket.write(packet.build(["PING"]));
				break;

			case "LOGIN":
				console.log("Interpret: " + command);

				var data = PacketModels.login.parse(datapacket);
				User.login(data.username, data.password, function(result, user){
					if(result){
						client.user = user;
						// user is not logged into the game yet
						if(!client.user.in_game){
							// Bind udp port and ip to client
							client.address = { address: client.socket.remoteAddress, port:data.udp_port };
							console.log('client.address: '+JSON.stringify(client.address));
							console.log("Logging in: "+client.user.username);
							client.socket.write(packet.build(["LOGIN", "TRUE", 
									client.user.current_room, client.user.pos_x, client.user.pos_y, client.user.username, client.user.game_role,
									// Stats
									client.user.level, client.user.expr, client.user.maxexpr, client.user.hp, client.user.maxhp, 
									client.user.stamina, client.user.maxstamina, client.user.attack]));
							client.user.in_game = true;
							client.user.save();
						}else{
							// That user is already logged in
							console.log(client.user.username+" already logged in");
							client.socket.write(packet.build(["LOGIN", "INGAME"]));
						}
					}else{
						client.socket.write(packet.build(["LOGIN", "FALSE"]));
					}
				});
				break;

			// currently not used
			/*case "REGISTER":
				var data = PacketModels.auth.parse(datapacket);
				console.log("Registering with username: " + data.username + " / password: " + data.password);
				User.register(data.username, data.password, function(result, user){
					if(result){
						console.log("Registration successful");
						client.socket.write(packet.build(["REGISTER", "TRUE"]));
					}else{
						console.log("Registration failed");
						client.socket.write(packet.build(["REGISTER", "FALSE"]));
					}
				});
				break;*/

			case "LOGOUT":
				console.log("Interpret: " + command);

				if(client.user){
					var data = PacketModels.stats.parse(datapacket);
					// Save stats
					update_stats(client.user, data.level, data.expr, data.maxexpr, data.hp, data.maxhp,
						data.stamina, data.maxstamina, data.attack);
					// Log out the client/user
					client.logout();
				}
				break;

			case "END":
				console.log("Interpret: " + command);
				
				// If client logged in for some reason
				if(client.user){
					// Log out client
					client.logout();
				}
				break;

			case "ENTER ROOM":
				console.log("Interpret: " + command);
				
				var data = PacketModels.enter_room.parse(datapacket);
				// enter the room
				//console.log('"'+client.user.username+'" now entering: '+data.target_room);
				client.enterroom(data.target_room, data.pos_x, data.pos_y, client.user.hp);
				break;	

			case "LEAVE ROOM":
				console.log("Interpret: " + command);
				
				var data = PacketModels.single_string.parse(datapacket);
				// leave the current room
				//console.log('Leaving room: '+data.string);
				client.leaveroom(data.string);
				break;

			// Receive player movement data
			case "POS":
				console.log("Interpret: " + command);
				
				var data = PacketModels.pos.parse(datapacket);
				//console.log("Data: "+JSON.stringify(data));
				// save new position data to client
				client.user.pos_x = data.pos_x;
				client.user.pos_y = data.pos_y;
				// send new position to all other users in the room
				client.broadcastroom(packet.build(["POS", client.user.username, data.pos_x, data.pos_y]));
				break;

			// Receive player face direction
			case "FACE":
				console.log("Interpret: " + command);
				
				var data = PacketModels.face.parse(datapacket);
				client.broadcastroom(packet.build(["FACE", client.user.username, data.face]));
				break;

			// Player stopped moving
			case "IDLE":
				console.log("Interpret: " + command);
				
				// Send idle state
				client.broadcastroom(packet.build(["IDLE", client.user.username]));
				break;

			// Receive enemy movement data
			case "ENEMY POS":
				console.log("Interpret: " + command);
				
				var data = PacketModels.pos_enemy.parse(datapacket);
				// send new position to all other users in the room
				client.broadcastroom(packet.build(["ENEMY POS", data.ID, data.pos_x, data.pos_y]));
				break;

			// Receive enemy face direction
			case "ENEMY FACE":
				console.log("Interpret: " + command);
				
				var data = PacketModels.face.parse(datapacket);
				var ID = data.string;
				client.broadcastroom(packet.build(["ENEMY FACE", ID, data.face]));
				break;

			// Enemy stopped moving
			case "ENEMY IDLE":
				console.log("Interpret: " + command);
				
				// Send idle state
				var data = PacketModels.single_string.parse(datapacket);
				var ID = data.string;
				client.broadcastroom(packet.build(["ENEMY IDLE", ID]));
				break;

			case "CHAT":
				console.log("Interpret: " + command);
				
				var data = PacketModels.single_string.parse(datapacket);
				client.broadcastroom(packet.build(["CHAT", data.string]));
				break;

			case "STATS":
				console.log("Interpret: " + command);
				
				var data = PacketModels.stats.parse(datapacket);
				// Update stats
				update_stats(client.user, data.level, data.expr, data.maxexpr, data.hp, data.maxhp,
						data.stamina, data.maxstamina, data.attack);
				// Broadcast to room
				client.broadcastroom(packet.build(["STATS", client.user.username, data.level, data.expr, data.maxexpr,
						data.hp, data.maxhp, data.stamina, data.maxstamina, data.attack]));
				break;

			case "SPRITE":
				console.log("Interpret: " + command);
				console.log("REMINDER: this seems obsolete");
				
				var data = PacketModels.single_string.parse(datapacket);
				// Update sprite
				client.user.sprite = data.string;
				// Save to DB
				client.user.save();
				// Broadcast to room
				client.broadcastroom(packet.build(["SPRITE", client.user.username, data.string]));
				break;

			case "DASH":
				console.log("Interpret: " + command);
				
				// Tell others about dashing
				client.broadcastroom(packet.build(["DASH", client.user.username]));
				break;

			case "ATTACK":
				console.log("Interpret: " + command);
				
				var data = PacketModels.face.parse(datapacket);
				// Tell others about attacking
				client.broadcastroom(packet.build(["ATTACK", client.user.username, data.face]));
				break;

			case "DAMAGE ENEMY":
				console.log("Interpret: " + command);
				
				var data = PacketModels.damage.parse(datapacket);

				var rm = client.user.current_room;
				maps[rm].enemies.forEach(function(e){

					if(e["ID"] === data.ID){
						e["stats"]["hp"] -= data.damage;
						if(e["stats"]["hp"] > 0){
							buffer = packet.build(["DAMAGE ENEMY", data.ID, data.damage, data.xforce, data.yforce]);
						} else {
							// Mark enemy as killed
							//e["stats"]["status"] = "dead";
							buffer = packet.build(["KILL ENEMY", data.ID]);
							e["stats"]["hp"] = e["stats"]["maxhp"];
						}
					}
				});
				// Tell others about damaging the enemy
				client.socket.write(buffer);
				client.broadcastroom(buffer);
				break;

			case "DAMAGE USER":
				console.log("Interpret: " + command);
				
				var data = PacketModels.damage.parse(datapacket);
				var username = data.ID;
				var buffer = packet.build(["DAMAGE USER", username, data.damage, data.xforce, data.yforce]);
				client.socket.write(buffer);
				client.broadcastroom(buffer);
				break;

			case "PUSSY":
				console.log("Interpret: " + command);
				
				// Calculate new spawn position
				var xx = Math.floor(Math.random() * (1200 - 20 + 1)) + 20;
				var yy = Math.floor(Math.random() * (700 - 20 + 1)) + 20;
				console.log('Respawning pussy @ '+xx+'/'+yy);
				buffer = packet.build(["PUSSY", client.user.username, xx, yy]);
				client.socket.write(buffer);
				client.broadcastroom(buffer);
				break;

			default:
				console.log("DEFAULT: " + command);
				break;
		}

	},

	interpret_udp: function(server, address, datapacket){

		var header = PacketModels.header.parse(datapacket);
		var command = header.command.toUpperCase();

	  //if(command != "POS"){
			console.log("Interpret UDP: " + command);
		//}

		switch(command){

			case "CONNECT":
				console.log("Client connected");
				// initiate client instance
				var c_inst = new require('./client.js');
				var client = new c_inst();
				// save client's address for reference
				client.address = address;
				// add clients if no connected clients so far
				if(server.clients.length == 0){
					server.clients.push(client);
				} else {
					// check if that client is already/still connected
					// stringify for comparison
					if(JSON.stringify(server.clients) == JSON.stringify(_.without(server.clients, client))){
						console.log('Connecting client!');
						server.clients.push(client);
					}else{
						console.log('Client already/still connected!');
					}	
				}

				console.log('Clients NOW:');
				server.clients.forEach(function(c){
					console.log(JSON.stringify(c));
				});

				client.initiate_udp(server);
				break;

			case "PING":
				// send ping back
				buffer = packet.build(["PING"]);
				server.send_udp(buffer, address);
				break;

			case "LOGIN":
				var data = PacketModels.auth.parse(datapacket);
				User.login(data.username, data.password, function(result, user){
					if(result){
						// get client of this connection
						server.get_client(address, function(client){
							console.log('stringify client: '+JSON.stringify(client));
							client.user = user;
							// user is not logged into the game yet
							if(!client.user.in_game){
								console.log("Logging in: "+client.user.username);
								client.enterroom_udp(server, client.user.current_room);
								client.user.in_game = true;
								client.user.save();
								// prepare buffer
								var buffer = packet.build(["LOGIN", "TRUE", 
										client.user.current_room, client.user.pos_x, 
										client.user.pos_y, client.user.username, client.user.game_role])
								server.send_udp(buffer, address);
							}else{ // that user is already logged in
								console.log(client.user.username+" already logged in");
								// prepare buffer
								var buffer = packet.build(["LOGIN", "INGAME"]);
								server.send_udp(buffer, address);
							}
						});
					}else{
						client.socket.write(packet.build(["LOGIN", "FALSE"]));
					}
				});
				break;

			case "LOGOUT":
				server.get_client(address, function(client){
					// if logged in
					if(client.user){
						// log out client
						client.logout_udp(server);
					}
				});
				break;

			case "END":
				server.get_client(address, function(client){
					// if for some reason logged in
					if(client.user){
						// log out client
						client.logout_udp(server);
					}
					// get index to remove
					var idx = server.clients.indexOf(client);
					// remove that conection
					server.clients.splice(idx, 1);

				});
				break;

			case "POS":
				var data = PacketModels.pos_udp.parse(datapacket);
				console.log("udp pos_x: "+data.pos_x);
				console.log("udp pos_y: "+data.pos_y);

				var client;
				maps[data.room].clients.forEach(function(c){
					if(c.address.address == address.address &&
						c.address.port == address.port){
						client = c;
					}
				});
				// save new position data to client
				client.user.pos_x = data.pos_x;
				client.user.pos_y = data.pos_y;
				client.user.save();
				// send new position to all other users in the room
				buffer = packet.build(["POS", client.user.username, data.pos_x, data.pos_y]);
				client.broadcastroom_udp(server, buffer);
				break;
		}

	}

}

//////////////////////////////
// 		Helper Functions 	//
//////////////////////////////
update_stats = function(user, lvl, expr, maxexpr, hp, maxhp, stamina, maxstamina, attack){
	user.level = lvl;
	user.expr = expr;
	user.maxexpr = maxexpr;
	user.hp = hp;
	user.maxhp = maxhp;
	user.stamina = stamina;
	user.maxstamina = maxstamina;
	user.attack = attack;
	// Save to DB
	user.save();
}