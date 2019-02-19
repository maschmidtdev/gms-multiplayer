exports.name = "Starting Zone";
exports.room = "rm_starting_zone";
exports.AI_host = ""; // Host executing AI logic

exports.start_x = 320;
exports.start_y = 320;

exports.clients = [];
exports.enemies = [
	{
		"ID": "Slime_01",
		"name": "Slime",
		"status": "alive",
		"spawn_x": 340,
		"spawn_y": 340,
		"stats": {
		}
	},

	{
		"ID": "Chinlin_01",
		"name": "Chinlin",
		"status": "alive",
		"spawn_x": 360,
		"spawn_y": 360,
		"stats": {
		}
	}
];