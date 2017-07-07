var mongoose = require("mongoose");


var Schema = mongoose.Schema;
var Log = new Schema({
    source: String,
    event_name: String,
    success: Boolean,
    date: Date,

    params: String,
    note: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});
mongoose.model("Log", Log);