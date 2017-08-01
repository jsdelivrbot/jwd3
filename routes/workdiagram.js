var jwtauth = require("../lib/jwtauth");
var dblogger = require("../lib/dblogger");
var fs = require("fs");
var conf = require("../conf");
var mongoose = require("mongoose");
var chalk = require('chalk');
//require("../models/ScanerRegistration");

module.exports = function (app) {
    //var ScanerRegistration = mongoose.model("ScanerRegistration");


    app.post("/api/workdiagram", jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var roles = decoded.roles;
        var params = req.body;

        //params to call func
        var scanerId = params['scaner_id'];
        var beginDateUnix = params['beginDateUnix'];
        var endDateUnix = params['endDateUnix'];
        var compareDiff = params['compareDiff'];

        //TODO send object ?
        var queryFunc = "showWorkDiagram()";//'" + scanerId + "'," + beginDateUnix + "," + endDateUnix + "," + compareDiff + ")";
        mongoose.connection.db.eval(queryFunc, function (err, obj) {
            if (err) {
                console.log('showWorkDiagram error', err.message);
                dblogger.log({
                    source: 'workdiagram./api/workdiagram',
                    event_name: 'mongoose.connection.db.eval',
                    success: false,
                    date: new Date(),
                    params: JSON.stringify(params),
                    note: err.message
                });

                res.send({
                    series: [0],
                    labels: ['error']
                });

                res.send("bad");
            }

            //console.log('obj=', obj);
            res.send(obj);
        });
    });
}