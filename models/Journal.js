module.exports = function (mongoose) {
    //journal model
    var journalSchema = new mongoose.Schema({
        note: String,
        data: String
    });
    var Journal = mongoose.model('Journal', journalSchema);

    return Journal;
}