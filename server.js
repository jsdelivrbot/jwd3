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

//app.use(express.methodOverride());
//app.use(function(req, res, next) {
//    console.info('cors ');
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content- Type, Accept');
//     next();
//});

app.use(express.cookieParser());
app.use(express.session({
    secret: "ggf54",
    key: "sid",
    cookie: {httpOnly: true}//false - accessible into document.cookie...
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
    console.log("connected to db");
});
mongoose.connect(conf.settings.database_url);

//ROUTING
require("./routes/auth")(app, mongoose);
require("./routes/index")(app);
require("./routes/gridresult")(app, mongoose);
require("./routes/serialport")(app, mongoose);

var server = http.createServer(app);

//SOCKET
var Journal = mongoose.model('Journal');
var io = require("socket.io").listen(server);

io.on('connection', function (socket) {

    socket.on('connect', function () {
        //socket.broadcast.emit('clients', { clients: Object.keys(io.connected).length });
    });

    socket.on('disconnect', function () {
        //todo if user is disconnected and editing any notes -> endNoteEditing
        socket.broadcast.emit('srvmesUserDisconnected', {});
    });

    socket.on('beginNoteEditing', function (msg) {
        Journal.findOneAndUpdate({ _id: msg.rowid }, { f_editing: true }, { upsert: true }, function (err, doc) {
            if (err)
                console.info('err ', err);
        });
        socket.emit('srvmesBeginNoteEditing');
    });
    socket.on('endNoteEditing', function (msg) {
        socket.emit('srvmesEndNoteEditing');
    });
});

server.listen(app.get("port"), function () {
    console.info("listen on port: " + app.get("port"));
});

//git test1