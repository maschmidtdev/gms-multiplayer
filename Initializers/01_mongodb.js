var mongoose = require('mongoose');
module.exports = gamedb = mongoose.createConnection(config.database, config.auth);
module.exports = admin = mongoose.mongo.admin;