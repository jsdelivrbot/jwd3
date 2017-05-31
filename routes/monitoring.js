var mongoose = require("mongoose");
var chalk = require('chalk');
var path = require('path');
var multer = require('multer');

module.exports = function (app) {
    //upload
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            console.info('file=', file);
            callback(null, 'log' + '-' + Date.now());
        }
    });
    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            var ext = path.extname(file.originalname);
            callback(null, true)
        }
    });

    var Test = mongoose.model("Test");

    app.post("/upload_log", function (req, res) {
        upload.any()(req, res, function (err) {
            if (err) {
                console.log(chalk.red('error upload'));
                res.setHeader("Content-type", "text/html");
                return res.end(err.message);
            }

            res.setHeader("Content-type", "text/html");
            return res.end('successfully upload');
        });

        /*var test = new Test({
        createDate: new Date()
        });
        test.save(function (err) {
        if (err)
        return res.send('POST failed to save into db');

        return res.send('POST successfulled');
        });*/
    });
};