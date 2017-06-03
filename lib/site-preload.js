var mongoose = require("mongoose");
//require('mongoose-function')(mongoose);
var chalk = require('chalk');

module.exports.check = function (app) {
    //***FUNCS***
    /*var mySchema = mongoose.Schema({ func: Function });
    var M = mongoose.model('Functions', mySchema);
    var m = new M;

    m.func = function(x){
        console.log('stored function', x)
    }
    m.save(function (err) {
        M.findById(m._id, function (err, doc) {
            doc.func(123); // logs "stored function" 
        });
    });*/
    
    //***JOURNAL ROOTS***
    var Journal = mongoose.model("Journal");

    /*db.system.js.save({
    _id: "echoFunction",
    value: function (x) {
    return 'echo: ' + x;
    }
    })*/

    //doc root
    var query = { parent: null, isFolder: true, journalType: 0 }; ;
    var data = { name: 'Документы',
        parent: null,
        isFolder: true,
        createDate: new Date(),
        journalType: 0,
        isReadonly: true
    };
    var options = { upsert: true };

    Journal.findOneAndUpdate(query, data, options, function (err, obj) {
        if (err) {
            console.log(chalk.red('upsert error! ', err.message));
        }
        global.docRootId = obj._id;
        console.log(chalk.red('upsert doc: ', obj));
    });


    //log root
    query = { parent: null, isFolder: true, journalType: 1 };
    data = { name: 'Логи',
        parent: null,
        isFolder: true,
        createDate: new Date(),
        journalType: 1,
        isReadonly: true
    };
    options = { upsert: true };

    Journal.findOneAndUpdate(query, data, options, function (err, obj) {
        if (err) {
            console.log(chalk.red('upsert log error! ', err.message));
        }
        global.logRootId = obj._id;
        console.log(chalk.red('upsert log: ', obj));
    });
};