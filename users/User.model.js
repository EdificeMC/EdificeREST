'use strict';

let mongoose = require('mongoose');

let UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    uuid: { type: String, required: true },
    joined: { type: Date, required: true },
    stars: { type: Array, required: false },
    logins: { type: Array, required: true }
});

module.exports = mongoose.model('User', UserSchema);
