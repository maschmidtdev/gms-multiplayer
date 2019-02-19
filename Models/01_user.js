var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
	username: {type: String, unique: true},
	password: String,
	in_game: Boolean,
	web_role: String,
	game_role: String, 

	sprite: String,

	current_room: String,
	pos_x: Number,
	pos_y: Number,

	// Stats
	hp: Number,
	maxhp: Number,
	stamina: Number,
	maxstamina: Number,
	level: Number,
	expr: Number,
	maxexpr: Number,
	attack: Number

});

userSchema.statics.register = function(username, password, cb){

	var new_user = new User({
		username: username,
		password: password,
		in_game: false,
		web_role: "user",
		game_role: "user",

		sprite: "spr_Player",

		current_room: maps[config.starting_zone].room,
		pos_x: maps[config.starting_zone].start_x,
		pos_y: maps[config.starting_zone].start_y,


		// SInitialize stats
		hp: 5,
		maxhp: 5,
		stamina: 10,
		maxstamina: 10,
		level: 1,
		expr: 0,
		maxexpr: 3,
		attack: 1
	});

	new_user.save(function(err){
		if(!err){
			cb(true);
		}else{
			console.log("Error: " + err);
			cb(false);
		}
	});

};

userSchema.statics.login = function(username, password, cb){

	User.findOne({username: username}, function(err, user){
		if(!err && user){
			if(user.validPassword(password)){
				cb(true, user);
			}else{
				cb(false, null);
			}
		}else{
			cb(false, null);
		}
	})
	
};

// methods ====================

// generating a hash
userSchema.methods.generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
};

// checking if password is valid
userSchema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);

module.exports = User = gamedb.model('users', userSchema);