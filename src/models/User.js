const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
    fullName: String,
    username: String,
    password: String
});

module.exports = model('User', UserSchema);