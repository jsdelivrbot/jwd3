var mongoose = require("mongoose");


var Schema = mongoose.Schema;
var OnlineScaner = new Schema({
    scaner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scaner'
    },
    registerDate: Date
});
mongoose.model("OnlineScaner", OnlineScaner);