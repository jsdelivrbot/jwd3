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
            var curDate = new Date().toISOString()
                                    .replace(/T/, ' ')
                                    .replace(/\..+/, '');
            res.setHeader("Content-type", "text/html");

            if (err) {
                console.log(chalk.red(curDate + ' error upload. ', err.message));
                return res.end(curDate, ' ', err.message);
            }

            //console.log(chalk.yelow(JSON.stringify(req.headers)));
            //console.log(chalk.green('received log file'));
            //console.log(chalk.green(JSON.stringify(req.body.params)));
            //console.log(chalk.yellow(JSON.stringify(req.headers)));
            console.log(chalk.green(curDate, ' upload log ', JSON.stringify(JSON.parse(req.body.params))));

            //1 file
            var files = req.files;
            var reqParams = JSON.parse(req.body.params);

            if (!files || files.length === 0) {
                console.log(chalk.red(curDate, ' log files is null'));
                return res.end(curDate, ' log files is null');
            }

            var file = files[0];
            var ext = path.extname(file.originalname);
            var basename = path.basename(file.originalname, ext);
            var resultFileName = basename + '(' + reqParams['ferry'] + ')' + ext;

            console.log(chalk.cyan(curDate, ' log file: ', JSON.stringify(file)));

            var doc = new Journal({
                name: resultFileName,
                //user: userId,
                fileName: file.filename,
                originalFileName: file.originalname,
                parent: global.logRootId,
                createDate: new Date(),
                isFolder: false,
                journalType: 1,
                uuid: reqParams.uuid,
                sn: reqParams.sn,
                note: reqParams.note,
                size: file.size,
                operations: ['del', 'view']
            });
            doc.save(function (err) {
                if (err) {
                    return res.end(curDate + ' error on save into db');
                    //return res.end(' error on save into db');
                }

                return res.end(curDate + ' successfully upload');
                //return res.end(' successfully upload');
            });
        });
    });
};