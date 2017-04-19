var jwtauth = require("../lib/jwtauth");

module.exports = function (app, mongoose) {
    //GET serial port
    app.get("/serialport2", jwtauth.authenticate, function (req, res) {
        res.render("serialport2");
    });
};