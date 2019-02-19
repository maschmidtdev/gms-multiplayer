var mongoose = require('mongoose');

var itemSchema = new mongoose.Schema({
	name: {type: String, unique: true},
	type: String,
	value: Number
});




// methods ====================

// create the model for users and expose it to our app
module.exports = mongoose.model('Item', itemSchema);

module.exports = Item = gamedb.model('items', itemSchema);