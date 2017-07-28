var jwtauth = require("../lib/jwtauth");
var dblogger = require("../lib/dblogger");
var fs = require("fs");
var conf = require("../conf");
var mongoose = require("mongoose");
var chalk = require('chalk');
require("../models/ScanerRegistration");

module.exports = function (app) {
    var ScanerRegistration = mongoose.model("ScanerRegistration");


    app.post("/api/workdiagram", jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var roles = decoded.roles;
        var params = req.body;

        console.info('body=', params);

        var scanerId = params['scaner_id'];

        //TODO range
        mongoose.connection.db.eval("showWorkDiagram(" + scanerId + ")", function (err, obj) {
            res.send(obj);
        });
    });
}