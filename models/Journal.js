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
    operations: Array,//['add', 'edit', 'del', 'view']
    uuid: String,//android uuid
    sn: String,//serial num
    note: String,//other info
    size: Number
});
mongoose.model("Journal", Journal);