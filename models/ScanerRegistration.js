var mongoose = require("mongoose");


var Schema = mongoose.Schema;
var ScanerRegistration = new Schema({
    scaner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scaner'
    },
    registerDate: Date,
    ip4: String,
    mac: String,
    wifiname: String,
    socketId: String,
    deviceTimeStamp: Date,
    sourceFolder: String,
    destZipFile: String
});
mongoose.model("ScanerRegistration", ScanerRegistration);