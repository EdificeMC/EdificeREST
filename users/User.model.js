'use strict';

var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    uuid: { type: String, required: true },
    stars: { type: Array, required: false },
    logins: { type: Array, required: true }
});

module.exports = mongoose.model('User', UserSchema);
