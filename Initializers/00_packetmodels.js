var Parser = require('binary-parser').Parser;
var StringOptions = {length: 99, zeroTerminated: true};

module.exports = PacketModels = {

	command: new Parser().skip(1)
		.string("command", StringOptions),

	single_string: new Parser().skip(1)
		.string("command", StringOptions)
		.string("string", StringOptions),

	single_num: new Parser().skip(1)
		.string("command", StringOptions)
		.int32le("num", StringOptions),

	login: new Parser().skip(1)
		.string("command", StringOptions)
		.string("username", StringOptions)
		.string("password", StringOptions)
		.int32le("udp_port", StringOptions),

	pos: new Parser().skip(1)
		.string("command", StringOptions)
		.int32le("pos_x", StringOptions)
		.int32le("pos_y", StringOptions),

	pos_enemy: new Parser().skip(1)
		.string("command", StringOptions)
		.string("ID", StringOptions)
		.int32le("pos_x", StringOptions)
		.int32le("pos_y", StringOptions),

	face: new Parser().skip(1)
		.string("command", StringOptions)
		.uint8("face", StringOptions),

	pos_udp: new Parser().skip(1)
		.string("command", StringOptions)
		.string("room", StringOptions)
		.int32le("pos_x", StringOptions)
		.int32le("pos_y", StringOptions),

	enter_room: new Parser().skip(1)
		.string("command", StringOptions)
		.string("target_room", StringOptions)
		.int32le("pos_x", StringOptions)
		.int32le("pos_y", StringOptions),

	damage: new Parser().skip(1)
		.string("command", StringOptions)
		.string("ID", StringOptions)
		.uint16le("damage", StringOptions)
		.int16le("xforce", StringOptions)
		.int16le("yforce", StringOptions),

	stats: new Parser().skip(1)
		.string("command", StringOptions)
		.int32le("level", StringOptions)
		.int32le("expr", StringOptions)
		.int32le("maxexpr", StringOptions)
		.int32le("hp", StringOptions)
		.int32le("maxhp", StringOptions)
		.int32le("stamina", StringOptions)
		.int32le("maxstamina", StringOptions)
		.int32le("attack", StringOptions)

}