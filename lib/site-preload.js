var mongoose = require("mongoose");
//require('mongoose-function')(mongoose);
var chalk = require('chalk');

module.exports.check = function (app) {
    //***JOURNAL ROOTS***
    var Journal = mongoose.model("Journal");

    //doc root
    var query = { parent: null, isFolder: true, journalType: 0 }; ;
    var data = { name: 'Документы',
        parent: null,
        isFolder: true,
        createDate: new Date(),
        journalType: 0,
        isReadonly: true,
        operations: ['add', 'view']
    };
    var options = { upsert: true };

    Journal.findOneAndUpdate(query, data, options, function (err, obj) {
        if (err) {
            console.log(chalk.red('upsert error! ', err.message));
        }
        global.docRootId = obj._id;
        //console.log(chalk.red('upsert doc: ', obj));
    });


    //log root
    query = { parent: null, isFolder: true, journalType: 1 };
    data = { name: 'Логи',
        parent: null,
        isFolder: true,
        createDate: new Date(),
        journalType: 1,
        isReadonly: true,
        operations: ['view']
    };
    options = { upsert: true };

    Journal.findOneAndUpdate(query, data, options, function (err, obj) {
        if (err) {
            console.log(chalk.red('upsert log error! ', err.message));
        }
        global.logRootId = obj._id;
        //console.log(chalk.red('upsert log: ', obj));
    });
};