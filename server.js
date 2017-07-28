var express = require("express");
var http = require("http");
var routes = require("./routes");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var mongoose = require("mongoose");
var conf = require("./conf");
var cors = require("cors");
var chalk = require('chalk');
var sitePreload = require('./lib/site-preload.js');
var os = require( 'os' );

//for net socket
var net = require('net');

var app = express();



//app.use(express.logger());
app.set('port', process.env.PORT || 8000);
app.set("views", __dirname + "/views");
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());
app.use(bodyParser.json());//parsing post body
app.use(express.methodOverride());//put, delete, connect....
app.use(express.urlencoded());

app.use(express.cookieParser());

app.use(express.session({
    secret: "ggf54",
    key: "sid",
    cookie: {httpOnly: false}//false - accessible into document.cookie...
}));

/*function csrfConf(fn) {
    return function (req, res, next) {
        if (req.path === '/upload_log' && req.method === 'POST') {//this url without csrf...........
            fn(req, res, next);
        } else {
            next();
        }
    }
};
app.use(csrfConf(express.csrf()));*/
app.use(function (req, res, next) {
    res.locals.csrftoken = req.session._csrf;
    next();
});

app.use(app.router);

app.disable('x-powered-by');

//MONGO
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function () {
    var curDate = new Date();
    console.log(chalk.green(curDate + " database is opened"));
    sitePreload.check(app);
});

mongoose.connect(conf.settings.database_url);

//SCHEMA
require("./models/Journal");
require("./models/User");

//ROUTING
//app.get('*', function (req, res, next) {
//    return next();
//});

var server = http.createServer(app);

var io = require("socket.io").listen(server);
//app.io = io;
io.on('connection', function (socket) {
    console.log(chalk.cyan(new Date(), 'socket user connected'));

    socket.on('disconnect', function () {
        console.log(chalk.cyan(new Date(), 'socket user disconnected'));
    });
});

require("./routes/auth")(app);
require("./routes/index")(app);
require("./routes/gridresult")(app);
require("./routes/monitoring")(app, io);
require("./routes/workdiagram")(app);

server.listen(app.get("port"), function () {
    console.log(chalk.green("listen on port: " + app.get("port")));

    //ip
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }

    console.log('server ips->', addresses);
});