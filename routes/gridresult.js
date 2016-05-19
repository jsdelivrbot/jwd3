var jwtauth = require("../lib/jwtauth");
//var Journal = require("../models/Journal");

module.exports = function (app, mongoose) {
    var Journal = require("../models/Journal")(mongoose);

    app.get("/protected", jwtauth.authenticate, function (req, res) {
        res.render("protected");
    });

    //journal get
    app.get("/api/protected/journal", jwtauth.authenticate, function (req, res) {
        var token = req.cookies.token;
        var decoded = jwtauth.decode(token);
        var userId = decoded.userId;

        //todo select by page.....
        Journal.find({ }, 'note _id f_editing')
            .exec(function (err, doc) {
                res.send(doc);
            });
    });

    //journal editing
    app.post("/api/protected/journal", jwtauth.authenticate, function (req, res) {
        var oper = req.body.oper;
        //console.info("oper: ", oper);

        if (!oper)
            return;
        switch (oper) {
            case 'edit':
                edit(req, res);
                break;
            case 'add':
                add(req, res);
                break;
            case 'del':
                del(req, res);
                break;
            default:
                break;
        }
    });

    //edit
    var edit = function (req, res) {
        console.info('req.body ', req.body);
        Journal.findOneAndUpdate({ _id: req.body.id }, { note: req.body.note, f_editing: false }, { upsert: true }, function (err, doc) {
            if (err)
                return res.send(500, { error: err });

            return res.send('note succesfully updated');
        });
    };

    //add
    var add = function (req, res) {
        var token = req.cookies.token;
        var decoded = jwtauth.decode(token);
        var userId = decoded.userId;

        var note = new Journal({ note: req.body.note, user: userId, f_editing: false });

        note.save(function (err, doc) {
            return res.send('note succesfully added');
        });
    };

    //del
    var del = function (req, res) {
        Journal.findOne({ _id: req.body.id }, function(err, doc){
            doc.remove(function(err, doc){
                //todo
                //console.info('err ', err);
                //console.info('doc ', doc);    
            });
            
        });

        //Journal.findByIdAndRemove(req.body.id, function(err, doc) {
        //});
        res.send('note succesfully deleted');
    };
};