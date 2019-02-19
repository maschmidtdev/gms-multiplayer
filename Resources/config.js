// Import required libraries
var args = require('minimist')(process.argv.slice(2));
var extend = require('extend');

// Store the environment variable
var environment = args.env || "test";

// Common config... ie: name, version, max players etc...
var common_conf = {
	name: "Gazu's mmo game server",
	version: "0.0.1",
	environment: environment,
	max_players: 100,
	data_paths: {
		items: __dirname + "/Game Data/Items/",
		maps: __dirname + "/Game Data/Maps/",
		enemies: __dirname + "/Game Data/Enemies/"
	},
	web_role: 'user',
	game_role: 'user',
	sprite: "spr_Player",
	starting_zone: "rm_starting_zone",
	auth: {auth: {authdb: "admin"}}
};

// Environment specific onfiguration
var conf = {
	production: {
		ip: args.ip || "0.0.0.0",
		port: args.port || 61037,
		database: "mongodb://gazu_mongoadmin:uvJagsikor@127.0.0.1:20962/gms_mmo_prod" // mongodb://gazu_mongoadmin:uvJagsikor@127.0.0.1:20962/
	},

	test: {
		ip: args.ip || "0.0.0.0",
		port: args.port || 61027,
		database: "mongodb://gazu_mongoadmin:uvJagsikor@127.0.0.1:20962/gms_mmo_test"
	}
};

extend(false, conf.production, common_conf);
extend(false, conf.test, common_conf);

module.exports = config = conf[environment];