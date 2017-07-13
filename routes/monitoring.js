var jwtauth = require("../lib/jwtauth");
var dblogger = require("../lib/dblogger");
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
    var deviceWaitingAnswerMSec = conf.settings.deviceWatingAnswerMSec;


    //***SOCKET***
    //var idsBasket = {};
    //periodical task
    setInterval(function () {
        var curDate = new Date().toISOString()
                                    .replace(/T/, ' ')
                                    .replace(/\..+/, '');

        io.sockets.emit('dev_kuku', curDate);
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

    //dd.mm.yyyy hh:mm:ss
    var dateFormat = function (date) {
        if (date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date)) {
            var str = date.getDate() + '.' +
                      (date.getMonth() + 1) + '.' +
                      date.getFullYear() + ' ' +
                      date.getHours() + ':' +
                      date.getMinutes() + ':' +
                      date.getSeconds();

            return str;
        } else {
            return null;
        }
    }

    //**********FROM DEVICE//**********

    //answer from device
    ioRouter.on('dev_kukuanswer', function (socket, args, next) {
        var msg = args[1];

        var params
        try {
            params = JSON.parse(msg);
        } catch (e) {
            dblogger.log({
                source: 'monitoring.kukuanswer',
                event_name: 'failed to parse answer params',
                success: false,
                date: new Date(),
                params: msg
            });

            return;
        }

        //***scaner upsert***
        var query = {
            //ferry: params['ferry'],
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
                console.log('scaner upsert error! ' + err.message);

                dblogger.log({
                    source: 'monitoring.kukuanswer',
                    event_name: 'Scaner.findOneAndUpdate',
                    success: false,
                    date: new Date(),
                    params: JSON.stringify(data),
                    note: err.message
                });
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
                socketId: socket.id,
                deviceTimeStamp: dateParse(params['devicetimestamp'])
            };
            options = { upsert: true };

            OnlineScaner.findOneAndUpdate(query, data, options, function (err, onlinescaner) {
                if (err) {
                    console.log('onlinescaner upsert error! ' + err.message);

                    dblogger.log({
                        source: 'monitoring.kukuanswer',
                        event_name: 'OnlineScaner.findOneAndUpdate',
                        success: false,
                        date: new Date(),
                        params: JSON.stringify(data),
                        note: err.message
                    });
                    return;
                }


            });
        });
    });

    //answer from device on download command
    ioRouter.on('dev_dlanswer', function (socket, args, next) {
        var msg = args[1];
        var params;

        try {
            params = JSON.parse(msg);
        } catch (e) {
            dblogger.log({
                source: 'monitoring.dev_dlanswer',
                event_name: 'failed to parse answer params',
                success: false,
                date: new Date(),
                params: msg
            });

            return;
        }

        var browserSourceId = params['browserSourceId'];
        var success = params['success'];

        io.sockets.emit('unblockrowid', args); //command to all browsers
        io.to(browserSourceId).emit('dlanswer', args); //command browser sender

        dblogger.log({
            source: 'monitoring.dev_dlanswer',
            event_name: 'answer from device',
            success: (success === "true"),
            date: new Date(),
            params: args
        });
    });

    //answer from device on set time command
    ioRouter.on('dev_setsettinganswer', function (socket, args, next) {
        //console.log('dev_setsettinganswer ', args);

        var devSourceId = socket.id; //id from device's socket
        var msg = args[1];
        var params;

        try {
            params = JSON.parse(msg);
        } catch (e) {
            dblogger.log({
                source: 'monitoring.dev_setservertimeanswer',
                event_name: 'failed to parse answer params',
                success: false,
                date: new Date(),
                params: msg
            });

            return;
        }

        var browserSourceId = params['browserSourceId'];
        var success = params['success'];

        io.to(browserSourceId).emit('setsettinganswer', args); //command browser sender

        dblogger.log({
            source: 'monitoring.dev_setsettinganswer',
            event_name: 'answer from device',
            success: (success === "true"),
            date: new Date(),
            params: args
        });
    });

    //**********FROM BROWSER CLIENT//**********

    //download from device
    ioRouter.on('dl', function (socket, args, next) {
        //console.info('dl args=', args);
        var data = args[1];

        var destId = data['socketId'];
        var uuid = data['uuid'];
        var rowid = data['rowid'];
        var browserSourceId = socket.id; //browser sender
        var ids = Object.keys(io.sockets.connected);

        //console.info('destId:', destId, ', ids:', ids);
        //device not found
        if (ids.indexOf(destId) === -1) {
            io.to(browserSourceId).emit('dlanswer', {//to browser
                success: false,
                info: "failed to find device"
            });

            dblogger.log({
                source: 'monitoring.dl',
                event_name: 'failed to find device',
                success: false,
                date: new Date(),
                params: 'uuid: ' + uuid + ', rowid: ' + rowid
            });

            return;
        }

        var sendData = {
            uuid: uuid,
            browserSourceId: browserSourceId,
            rowid: rowid
        };
        io.sockets.emit('blockrowid', rowid); //command to all browsers
        io.to(destId).emit('dev_download', sendData); //command to device

        dblogger.log({
            source: 'monitoring.dl',
            event_name: 'download from service',
            success: true,
            date: new Date(),
            params: 'destId:' + destId + ', uuid:' + uuid + ', rowid:' + rowid + ', browserSourceId:' + browserSourceId
        });
    });

    //set server time
    ioRouter.on('setsetting', function (socket, args, next) {
        //console.log('setsetting ', args);
        var data = args[1];

        var destId = data['socketId'];
        var uuid = data['uuid'];
        var name = data['name'];
        var value = data['value'];


        var browserSourceId = socket.id; //browser sender
        var ids = Object.keys(io.sockets.connected);

        //device not found
        if (ids.indexOf(destId) === -1) {
            //console.log('failed to find device ', args);

            setTimeout(function () {
                io.to(browserSourceId).emit('setsettinganswer', {//to browser
                    success: false,
                    info: "failed to find device"
                });
            }, 300);

            dblogger.log({
                source: 'monitoring.setsetting',
                event_name: 'failed to find device',
                success: false,
                date: new Date(),
                params: 'uuid: ' + uuid + ', data: ' + data
            });

            return;
        }

        //console.log('dev_setservertime');
        var dateFormatStr = dateFormat(new Date());
        var sendData = {
            dateFormatStr: dateFormatStr,
            browserSourceId: browserSourceId,
            name: name,
            value: value
        };

        io.to(destId).emit('dev_setsetting', sendData); //command to device

        dblogger.log({
            source: 'monitoring.setservertime',
            event_name: 'set server time',
            success: true,
            date: new Date(),
            params: 'uuid: ' + uuid + ', sendData: ' + sendData
        });
    });



    io.use(ioRouter);

    //***PAGE***
    app.get("/monitoring", jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var roles = decoded.roles;

        //TODO чеза хрень ?
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

                serverTime: { $subtract: [new Date(), 0] },

                _id: 1, registerDate: 1, uuid: "$sc.uuid", sn: "$sc.sn", ferry: "$sc.ferry",
                ip4: 1, mac: 1, wifiname: 1, socketId: 1, deviceTimeStamp: 1
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