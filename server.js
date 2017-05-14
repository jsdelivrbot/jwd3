var express = require("express");
var http = require("http");
var routes = require("./routes");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var mongoose = require("mongoose");
var conf = require("./conf");
var cors = require("cors");

var app = express();



//app.use(express.logger());
app.set('port', process.env.PORT || 8000);
app.set("views", __dirname + "/views");
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());
app.use(bodyParser.json());//parsing post body
//app.use(express.methodOverride());//put, delete, connect....
app.use(express.urlencoded());

app.use(express.cookieParser());
app.use(express.session({
    secret: "ggf54",
    key: "sid",
    cookie: {httpOnly: false}//false - accessible into document.cookie...
}));
app.use(express.csrf());
app.use(function (req, res, next) {
    res.locals.csrftoken = req.session._csrf;
    next();
});

app.use(app.router);

app.disable('x-powered-by');

//MONGO
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
    console.log("database is opened");
});

mongoose.connect(conf.settings.database_url);

//SCHEMA
require("./models/Journal");
require("./models/User");

//ROUTING
//app.get('*', function (req, res, next) {
//    return next();
//});

require("./routes/auth")(app);
require("./routes/index")(app);
require("./routes/gridresult")(app);
require("./routes/monitoring")(app);

var server = http.createServer(app);

var io = require("socket.io").listen(server);
io.set('log level', 0);

io.on('connection', function (socket) {
    io.sockets.emit('clients', { 'totalClients': Object.keys(io.sockets.connected).length });

    socket.on('disconnect', function () {
        io.sockets.emit('clients', { 'totalClients': Object.keys(io.sockets.connected).length });
    });
});



server.listen(app.get("port"), function () {
    console.info("listen on port: " + app.get("port"));
});