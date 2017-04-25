var jwtauth = require("../lib/jwtauth");
var fs = require('fs');
var path = require('path');
var multer = require('multer');

module.exports = function (app, mongoose) {

    //upload
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '-' + Date.now()); //originalname
            //callback(null, file.originalname); //originalname
        }
    });
    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            var ext = path.extname(file.originalname);
            if (ext !== '.pdf' && ext !== '.html') {
                return callback(new Error('Only .pdf and .html'))
            }

            callback(null, true)
        }
    }); //.single('doc');


    var Journal = require("../models/Journal")(mongoose);

    app.get("/doctree", jwtauth.authenticate, function (req, res) {
        res.render("doctree");
    });

    //get doc
    app.post("/api/doc", jwtauth.authenticate, function (req, res) {
        var token = req.cookies.token;
        var decoded = jwtauth.decode(token);
        var userId = decoded.userId;

        Journal.find({}, 'name _id fileName originalFileName data parent_id')
            .exec(function (err, data) {
                res.send({
                    doc: data
                });
            });
    });

    //get doc by parent
    app.post("/api/doc_by_parent", jwtauth.authenticate, function (req, res) {
        var token = req.cookies.token;
        var decoded = jwtauth.decode(token);
        var userId = decoded.userId;

        Journal.find({'parent_id': req.body.parentId}, 'name _id fileName originalFileName data parent_id')
            .exec(function (err, data) {
                res.send({
                    doc: data
                });
            });
    });

    //отображение документа
    app.get(/doc-\d+$/, jwtauth.authenticate, function (req, res) {
        var docName = req.originalUrl.substring(1, req.originalUrl.length);

        Journal.find({ fileName: docName }, 'fileName')
            .exec(function (err, data) {
                if (data.length === 0) {
                    res.render("errors/404");
                    return;
                }

                res.render("doc", {
                    docName: docName
                });
            });
    });

    //get doc name
    app.post("/api/doc_name", jwtauth.authenticate, function (req, res) {
        var token = req.cookies.token;
        var decoded = jwtauth.decode(token);
        var userId = decoded.userId;

        Journal.find({}, 'fileName')
            .exec(function (err, data) {
                res.send({
                    doc: data
                });
            });
    });

    //add into db
    var addDb = function (req, res) {
        //console.log(req.file);//filename
        var file = req.file;

        var token = req.cookies.token;
        var decoded = jwtauth.decode(token);
        var userId = decoded.userId;

        var doc = new Journal({
            name: file.originalname,
            user: userId,
            fileName: file.filename,
            originalFileName: file.originalname,
            parent_id: req.body.parentId
        });

        doc.save();
    };

    //del from db
    var delFromDb = function (req, res) {
        Journal.findOne({ _id: req.body.id }, function (err, doc) {
            doc.remove(function (err, doc) {
                //todo
                //console.info('err ', err);
                //console.info('doc ', doc);    
            });

        });

        //Journal.findByIdAndRemove(req.body.id, function(err, doc) {
        //});
        res.send('note succesfully deleted');
    };

    //TODO jwtauth.authenticate не работает
    app.post('/api/protected/journal/upload', function (req, res, next) {
        upload.single('doc')(req, res, function (err) {
            if (err) {
                return
            }
            //save into db
            addDb(req, res);
        });

        res.setHeader("Content-type", "text/html");
        res.end("File is uploaded");
    });

    //del doc
    app.post('/api/protected/journal/del', function (req, res, next) {
        Journal.findOne({ _id: req.body.id }, function (err, doc) {
            doc.remove(function (err, doc) {

            });
        });

        res.send({ message: "File is deleted" });
    });
};