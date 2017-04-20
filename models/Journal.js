module.exports = function (mongoose) {
    //journal model
    var journalSchema = new mongoose.Schema({
        note: String,
        data: String,
        file: Object
    });
    var Journal = mongoose.model('Journal', journalSchema);

    return Journal;
}