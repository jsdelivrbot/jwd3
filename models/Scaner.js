var mongoose = require("mongoose");


var Schema = mongoose.Schema;
var Scaner = new Schema({
    ferry: String,
    uuid: {
        type: String,
        unique: true
    },//android uuid
    sn: String,//serial num
    note: String,//other info
    isused: Boolean
});
mongoose.model("Scaner", Scaner);