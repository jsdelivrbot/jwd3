var mongoose = require("mongoose");
require("../models/Log");

module.exports.log = function (obj) {


    var Log = mongoose.model("Log");

    var log = new Log(obj);
    log.save(function(e, log){
        if(e) {
            
        }
    });
};