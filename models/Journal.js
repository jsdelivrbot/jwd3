module.exports = function (mongoose) {
    //journal model
    var journalSchema = new mongoose.Schema({
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
        isFolder: Boolean
    });
    var Journal = mongoose.model('Journal', journalSchema);

    return Journal;
}