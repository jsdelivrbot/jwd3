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
            callback(null, true)
        }
    });

    //var Test = mongoose.model("Test");
    var Journal = mongoose.model("Journal");

    app.post("/upload_log", function (req, res) {
        upload.any()(req, res, function (err) {
            if (err) {
                console.log(chalk.red('error upload. ', err.messag));
                res.setHeader("Content-type", "text/html");
                return res.end(err.message);
            }

            var files = req.files;
            //console.log(chalk.green('body=', JSON.stringify(req.body)));
            //console.log(chalk.green('params=', JSON.stringify(req.files)));

            //1 file
            var file = files[0];

            var doc = new Journal({
                name: file.originalname,
                //user: userId,
                fileName: file.filename,
                originalFileName: file.originalname,
                parent: global.logRootId,
                createDate: new Date(),
                isFolder: false,
                journalType: 1,
                isReadonly: true
            });
            doc.save(function (err) {
                if (err) { 
                    res.setHeader("Content-type", "text/html");
                    return res.end('error on save into db');
                }

                res.setHeader("Content-type", "text/html");
                return res.end('successfully upload');
            });
        });
    });
};