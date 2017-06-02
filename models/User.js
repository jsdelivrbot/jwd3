var mongoose = require("mongoose");


var Schema = mongoose.Schema;
var User = new Schema({
    email: {
        type: String,
        unique: true
    },
    hash: String,
    salt: String,
    roles: Array,
    createDate: Date
});
mongoose.model("User", User);