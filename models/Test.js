var mongoose = require("mongoose");


var Schema = mongoose.Schema;
var Test = new Schema({
    name: String,
    createDate: Date
});
mongoose.model("Test", Test);