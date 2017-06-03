var mongoose = require("mongoose");


var Schema = mongoose.Schema;
var Journal = new Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Journal'
    },
    name: String,
    fileName: String,
    originalFileName: String,
    createDate: Date,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isFolder: Boolean,
    isHome: Boolean,
    journalType: Number,
    isReadonly: Boolean,
    uid: String,//android uid
    sn: String,//serial num
    note: String//other info
});
mongoose.model("Journal", Journal);