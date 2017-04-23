module.exports = function (mongoose) {
    //journal model
    var journalSchema = new mongoose.Schema({
        parent_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Journal'
        },
        name: String,
        fileName: String,
        originalFileName: String,
        data: String
    });
    var Journal = mongoose.model('Journal', journalSchema);

    return Journal;
}