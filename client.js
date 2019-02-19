var now = require('performance-now');
var _ = require('underscore');

module.exports = function(){

	var client = this;

	// These objects will be added at runtime
	// this.socket = {}
	// this.user = {}

	//////////////////
	//	Initialize  //
	//////////////////

	this.initiate = function(){
		// Send the connection handshake packet
		client.socket.write(packet.build(["HELLO", now().toString()]));
		console.log('TCP: Client initiated');
	};

	this.initiate_udp = function(server){
		// Send the connection handshake packet
		buffer = packet.build(["HELLO", now().toString()])
		server.send_udp(buffer, client.address);
		console.log('UDP: Client initiated');
	};


	////////////////////
	// Client methods //
	////////////////////

	// Client receives data
	this.data = function(data){
		//console.log("Client data " + data);
		packet.parse(client, data);
	};


	// Client logs in
	this.login = function(target_room){
		// Leave the current room
		client.leaveroom(client.user.current_room);
		// Send room enter information to all clients in current room
		maps[target_room].clients.forEach(function(otherClient){

			// Notify otherClient
			otherClient.socket.write(packet.build(["ENTER ROOM", client.user.username, client.user.pos_x, client.user.pos_y]));
			// Get otherClient's position
			client.socket.write(packet.build(["POS", otherClient.user.username, otherClient.user.pos_x, otherClient.user.pos_y]));
		});
		// Then enter target room
		maps[target_room].clients.push(client);
		client.user.current_room = target_room;
		client.user.save();
	};

	// Client enters a room
	this.enterroom = function(target_room){
		if(maps[target_room].AI_host == ""){
			maps[target_room].AI_host = client.user.username;
		}
		maps[target_room].clients.forEach(function(otherClient){

			// Notify otherClient
			otherClient.socket.write(packet.build(["ENTER ROOM", client.user.username, client.user.pos_x, client.user.pos_y,
				client.user.hp, client.user.maxhp]));
			// Get otherClient's data
			client.socket.write(packet.build(["ENTER ROOM", otherClient.user.username, otherClient.user.pos_x, otherClient.user.pos_y,
				otherClient.user.hp, otherClient.user.maxhp]));
		});
		// Spawn the current enemies
		maps[target_room].enemies.forEach(function(enemy){
			if(enemy["status"] == "alive"){
				// Prepare buffer
				var ID = enemy["ID"];
				var asset = enemy["stats"]["asset"];
				var spawn_x = enemy["spawn_x"];
				var spawn_y = enemy["spawn_y"];
				var hp = enemy["stats"]["hp"];
				var maxhp = enemy["stats"]["maxhp"];
				var expr = enemy["stats"]["expr"];
				var buffer = packet.build(["SPAWN ENEMY", ID, asset, spawn_x, spawn_y, hp, maxhp, expr]);
				client.socket.write(buffer);
			}
		});
		// Send AI_host information
		client.socket.write(packet.build(["AI HOST", maps[target_room].AI_host]));

		// Then enter target room
		maps[target_room].clients.push(client);
		client.user.current_room = target_room;
		client.user.save();
	};

	// Client enters a room
	this.enterroom_udp = function(server, selected_room){
		// Send room enter information to all clients in current room

		maps[selected_room].clients.forEach(function(otherClient){
			// Prepare buffer
			var buffer = packet.build(["ENTER ROOM", client.user.username, client.user.pos_x, client.user.pos_y]);
			// Notify otherClient
			server.send_udp(buffer, otherClient.address);
			// Prepare buffer
			buffer = packet.build(["POS", otherClient.user.username, otherClient.user.pos_x, otherClient.user.pos_y]);
			// Get otherClient's position
			server.send_udp(buffer, client.address);
		});
		// Then add self to the room
		maps[selected_room].clients.push(client);
	};

	// Client leaves a room
	this.leaveroom = function(current_room){
		// Remove AI host
		if(maps[current_room].AI_host == client.user.username){
			maps[current_room].AI_host = "";
			console.log("REMOVING AI HOST");
		}

		// Remove self from the current room
		console.log('Removing "'+client.user.username+'" from "'+current_room+"'");
		maps[current_room].clients = _.without(maps[current_room].clients, client)

		// Prepare buffer, notify other useres we left the room
		var buffer = packet.build(["LEAVE ROOM", client.user.username]);

		maps[current_room].clients.forEach(function(otherClient){
			// Choose new AI_host if currently none
			if(maps[current_room].AI_host === ""){
				var new_host = otherClient.user.username;
				console.log("No AI host, selecting new Host: " + new_host);
				maps[current_room].AI_host = new_host;
			}
			if(otherClient.user.username != client.user.username){
				// Notify others client left room
				otherClient.socket.write(buffer);
				// Tell client new AI Host
				otherClient.socket.write(packet.build(["AI HOST", maps[current_room].AI_host]));
			};
		});
	};	

	// Client leaves a room
	this.leaveroom_udp = function(server, selected_room){
		// Counter variables
		var i = 0;
		var j = 0;
		maps[client.user.current_room].clients.forEach(function(otherclient){
			if(otherclient.user.username != client.user.username){
				// Prepare buffer
				buffer = packet.build(["LEAVE ROOM", client.user.username]);
				server.send_udp(buffer, otherClient.address);
			}else{
				j = i;
			}
			i += 1;
		});
		// Now remove self from room
		maps[client.user.current_room].clients.splice(j, 1);
	};

	// Broadcast information to other clients in room
	this.broadcastroom = function(packet){
		maps[client.user.current_room].clients.forEach(function(otherClient){
			if(otherClient.user.username != client.user.username){
				otherClient.socket.write(packet);
			}
		});
	};

	// Broadcast information to other clients in room
	this.broadcastroom_udp = function(server, buffer){
		maps[client.user.current_room].clients.forEach(function(otherClient){
			if(otherClient.user.username != client.user.username){
				server.send_udp(buffer, otherClient.address);
			}
		});
	};

	this.logout = function(){
		// Leave the room
		client.leaveroom(client.user.current_room);
		// Log out client
		client.user.in_game = false;
		// Save to db
		client.user.save();
		// Delete user from client
		delete client.user;
	};

	this.logout_udp = function(server){
		client.leaveroom_udp(server, client.user.current_room);
		client.user.in_game = false;
		client.user.save();
		delete client.user;
	};

	this.error = function(err){
		//console.log("Connection error: " + err.toString());
		console.log("Socket error: " + err);
		// Socket ended unexpectedly
		if(err.toString() == "Error: read ECONNRESET"){
			console.log("Ending socket");
			client.end();
		}
	};

	this.end = function(){
		// If logged in
		if(client.user){
			client.logout();
		}
		console.log("Connection closed");
	};

}