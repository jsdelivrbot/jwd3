var jwtauth = require("../lib/jwtauth");
var conf = require("../conf");
var mongoose = require("mongoose");
var chalk = require('chalk');
var path = require('path');
var multer = require('multer');
var ioRouter = require('socket.io-events')();
require("../models/Journal");
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

    var Journal = mongoose.model("Journal");
    var Scaner = mongoose.model("Scaner");
    var OnlineScaner = mongoose.model("OnlineScaner");
    var timeWarningDiff = conf.settings.monitoringTimeDiffWarningMinutes;
    var queryIntervalSec = conf.settings.monitoringQueryIntervalMSec;

    var deviceTimeWarningDiff = conf.settings.monitoringDeviceDiffWarningSec;


    //***SOCKET***

    //periodical task
    setInterval(function () {
        var curDate = new Date().toISOString()
                                    .replace(/T/, ' ')
                                    .replace(/\..+/, '');

        io.sockets.emit('kuku', curDate);
    }, queryIntervalSec);

    //datetime parse
    var dateParse = function (str) {
        var sep = str.split(" ");
        if (sep.length !== 2) {
            return null;
        }

        var dateArr = sep[0].split(".");
        if (dateArr.length !== 3) {
            return null;
        }

        var timeArr = sep[1].split(":");
        if (timeArr.length !== 3) {
            return null;
        }

        //console.log('dateArr=', dateArr, ', timeArr=', timeArr);

        return new Date(parseInt(dateArr[2]), parseInt(dateArr[1] - 1), parseInt(dateArr[0]),
                        parseInt(timeArr[0]), parseInt(timeArr[1]), parseInt(timeArr[2]));
    }

    ioRouter.on('kukuanswer', function (socket, args, next) {
        var msg = args[1];
        //console.log(new Date() + 'kukuanswer. msg=' + msg);

        var params = JSON.parse(msg);

        //***scaner upsert***
        var query = {
            ferry: params['ferry'],
            sn: params['sn'],
            uuid: params['uuid']
        };
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
                return;
            }

            //***online scaner upsert***
            query = { scaner: scaner['_id'] };
            data = {
                scaner: scaner['_id'],
                registerDate: new Date(),
                ip4: params['ip4'],
                mac: params['mac'],
                wifiname: params['wifiname'],
                deviceTimeStamp: dateParse(params['devicetimestamp'])
            };
            options = { upsert: true };

            OnlineScaner.findOneAndUpdate(query, data, options, function (err, onlinescaner) {
                if (err) {
                    console.log(chalk.red('onlinescaner upsert error! ' + err.message));
                    return;
                }
            });
        });
    });

    ioRouter.on('dlanswer', function (socket, args, next) {
        console.log('download answer ', args);
        io.sockets.emit('dlanswer', args);
    });

    io.use(ioRouter);

    //download command
    app.post("/api/dl", jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var roles = decoded.roles;

        //console.info(req.body);

        io.sockets.emit('download', req.body.uuid);
        return res.send('start download');
    });

    //***PAGE***
    app.get("/monitoring", jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var roles = decoded.roles;

        return res.render('monitoring', {
            roles: roles
        });
    });

    //***MONITORING SCANER DATA***
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
            { $project: {
                timeDiff: { $multiply: [{ $subtract: [new Date(), '$registerDate'] }, (1 / 1000 / 60)] }, //minutes
                status: { $subtract: [timeWarningDiff, { $multiply: [{ $subtract: [new Date(), '$registerDate'] }, (1 / 1000 / 60)]}] }, //cur date and register date

                deviceTimeDiff: { $multiply: [{ $subtract: [new Date(), '$deviceTimeStamp'] }, (1 / 1000)] }, //sec
                statusDeviceDiff: { $subtract: [deviceTimeWarningDiff, { $multiply: [{ $subtract: [new Date(), '$deviceTimeStamp'] }, (1 / 1000)]}] }, //cur date and device date

                _id: 1, registerDate: 1, uuid: "$sc.uuid", sn: "$sc.sn", ferry: "$sc.ferry",
                ip4: 1, mac: 1, wifiname: 1, deviceTimeStamp: 1
            }
            }
        ], function (err, data) {
            if (err) {
                return res.render("errors/500");
            }

            //console.log(chalk.green(JSON.stringify(data)) + '\n');
            return res.send(data);
        });
    });

    app.post("/upload_log", function (req, res) {
        upload.any()(req, res, function (err) {
            //console.log(chalk.green('upload_log'));

            var curDate = new Date().toISOString()
                                    .replace(/T/, ' ')
                                    .replace(/\..+/, '');
            res.setHeader("Content-type", "text/html");

            if (err) {
                console.log(chalk.red(curDate + ' error upload. ', err.message));
                return res.end(curDate, ' ', err.message);
            }

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

            //console.log(chalk.cyan(curDate, ' log file: ', JSON.stringify(file)));

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