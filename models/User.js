//var mongoose = require("mongoose");

module.exports = function (mongoose) {
    //user model
    var userSchema = new mongoose.Schema({
        email: {
            type: String,
            unique: true
        },
        hash: String,
        salt: String,
        roles: Array
    });
    var User = mongoose.model('User', userSchema);

    return User;
}