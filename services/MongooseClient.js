var mongoose = require('mongoose');
var logger = require('winston');

mongoose.connect('mongodb://localhost/edifice-test');

// CONNECTION EVENTS
mongoose.connection.on('connected', function() {
    logger.info('Mongoose connected');
});

mongoose.connection.on('error', function(err) {
    var message = 'Mongoose connection error: ' + err.message;
    logger.error(message);
});

mongoose.connection.on('disconnected', function() {
    logger.info('Mongoose disconnected');
});

module.exports = mongoose;
