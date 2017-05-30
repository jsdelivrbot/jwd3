var mongoose = require("mongoose");
var colors = require("../lib/colors");


module.exports = function (app) {
    var Test = mongoose.model("Test");

    app.get("/test", function (req, res) {
        console.info('params=', req.params, ', ', req.body, ', ', req.query);
        console.info(colors.BgRed, req.headers);

        var test = new Test({
            createDate: new Date()
        });
        test.save(function (err) {
            if (err)
                return res.send('failed to save into db');

            return res.send('successfulled');
        });
    });
};