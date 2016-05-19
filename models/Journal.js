//var mongoose = require("mongoose");

module.exports = function (mongoose) {
    //journal model
    var journalSchema = new mongoose.Schema({
        note: String,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        f_editing: Boolean
    });
    var Journal = mongoose.model('Journal', journalSchema);

    return Journal;
}