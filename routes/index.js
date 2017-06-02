var mongoose = require("mongoose");

module.exports = function (app) {
    var Journal = mongoose.model("Journal");

    app.get("/", function (req, res) {
        Journal.findOne({ isHome: true }, 'fileName')
            .exec(function (err, data) {
                return res.render("index", {
                    docName: (data && ('fileName' in data)) ? data.fileName : ""
                });
            });
    });

    app.get("/401", function (req, res) {
        res.render('/errors/401');
    });

    //...about
};