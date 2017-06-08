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
            if (err) {
                console.log(chalk.red('error upload. ', err.message));
                res.setHeader("Content-type", "text/html");
                return res.end(err.message);
            }

            //console.log(chalk.yelow(JSON.stringify(req.headers)));
            //console.log(chalk.green('received log file'));
            //console.log(chalk.green(JSON.stringify(req.body.params)));

            //console.log(chalk.red('--------------------------------'));
            //console.log(chalk.yellow(JSON.stringify(req.headers)));
            console.log(chalk.green(JSON.stringify(JSON.parse(req.body.params))));
            //console.log(chalk.red('--------------------------------'));

            //1 file
            var files = req.files;
            var reqParams = JSON.parse(req.body.params);

            if (!files || files.length === 0) {
                console.log(chalk.red('error get files'));
                res.setHeader("Content-type", "text/html");
                return res.end('files is null');
            }

            var file = files[0];

            var ext = path.extname(file.originalname);
            var basename = path.basename(file.originalname, ext);
            var resultFileName = basename + '(' + reqParams['ferry'] + ')' + ext;

            console.log(chalk.cyan(JSON.stringify(file)));

            var doc = new Journal({
                name: resultFileName,
                //user: userId,
                fileName: file.filename,
                originalFileName: file.originalname,
                parent: global.logRootId,
                createDate: new Date(),
                isFolder: false,
                journalType: 1,
                isReadonly: true,
                uuid: reqParams.uuid,
                sn: reqParams.sn,
                note: reqParams.note,
                size: file.size,
                operations: ['del', 'view']
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