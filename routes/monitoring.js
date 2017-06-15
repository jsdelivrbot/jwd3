var jwtauth = require("../lib/jwtauth");
var conf = require("../conf");
var mongoose = require("mongoose");
var chalk = require('chalk');
var path = require('path');
var multer = require('multer');
require("../models/Scaner");
require("../models/OnlineScaner");

module.exports = function (app, io) {
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

    var Scaner = mongoose.model("Scaner");
    var OnlineScaner = mongoose.model("OnlineScaner");
    var timeWarningDiff = conf.settings.monitoringTimeDiffWarningMinutes;

    //page
    app.get("/monitoring", jwtauth.authenticate, function (req, res) {
        return res.render('monitoring');
    });
    //monitoring scaner data
    app.post("/api/scaner_data", jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var userId = decoded.userId;

        //find into db
        OnlineScaner.aggregate([
            { $match: {} },
            { $lookup: { from: "scaners",
                localField: "scaner",
                foreignField: "_id",
                as: "sc"
            }
            },
            { $unwind: '$sc' },
            { $project: { _id: 1,
                timeDiff: {$multiply: [{ $subtract: [ new Date(), '$registerDate']}, (1/1000/60)]},//minutes
                timeDiffIsWarning: {$subtract: [timeWarningDiff, {$multiply: [{ $subtract: [ new Date(), '$registerDate']}, (1/1000/60)]}]},
                registerDate: 1, uuid: "$sc.uuid", sn: "$sc.sn", ferry: "$sc.ferry"
            }
            }
        ], function (err, data) {
            if (err) {
                return res.render("errors/500");
            }

            console.info(data);
            return res.send(data);
        });
    });

    //scaner kuku. Scaner register here
    app.post("/send_scaner_info", function (req, res) {
        var params = req.body;

        //***scaner upsert***
        var query = { uuid: params['uuid'] };
        var data = {
            ferry: params['ferry'],
            sn: params['sn'],
            uuid: params['uuid'],
            isused: true
        };
        var options = { upsert: true };

        Scaner.findOneAndUpdate(query, data, options, function (err, scaner) {
            if (err) {
                console.log(chalk.red('scaner upsert error! ' + err.message));
                return res.end('scaner upsert error');
            }

            //***online scaner upsert***
            query = { scaner: scaner['_id'] };
            data = {
                scaner: scaner['_id'],
                registerDate: new Date()
            };
            options = { upsert: true };

            OnlineScaner.findOneAndUpdate(query, data, options, function (err, onlinescaner) {
                if (err) {
                    console.log(chalk.red('onlinescaner upsert error! ' + err.message));
                    return res.end('onlinescaner upsert error');
                }

                io.sockets.emit('updatescanerinfo', req.body);
            });
        });

        return res.end('POST send_scaner_info');
    });



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
                note: 'uuid:' + reqParams['uuid'] + ';sn:' + reqParams['sn'] + ';ferry:' + reqParams['ferry'], //reqParams.note,
                size: file.size,
                operations: ['del', 'view']
            });
            doc.save(function (err) {
                if (err) {
                    return res.end(curDate + ' error on save into db');
                }

                return res.end(curDate + ' successfully upload');
            });
        });
    });
};