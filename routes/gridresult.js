var jwtauth = require("../lib/jwtauth");
var fs = require('fs');
var path = require('path');
var multer = require('multer');
var _ = require("../lib/underscore/underscore.js");

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
    });


    var Journal = require("../models/Journal")(mongoose);

    app.get("/doctree", jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var roles = decoded.roles;

        res.render("doctree", {
            roles: roles
        });
    });

    //get doc
    app.post("/api/doc", jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var userId = decoded.userId;

        var root = {
            _id: '000000000000000000000001',
            name: 'root',
            parent: null,
            isFolder: true
        };

        Journal.find({}).populate('user').exec(function (err, docs) {
            //TODO оптимизировать
            var queue = [];
            var currentNode;
            var getChildren = function (parent_id) {
                var children = _.filter(docs, function (item) {
                    var isEquals = new String(item['parent']).valueOf() == new String(parent_id).valueOf();
                    return isEquals;
                });

                return children;
            };

            queue.push(root);

            //children
            var getRecursive = function (node) {
                var children = getChildren(node['_id']);
                for (var x = 0; x < children.length; x++) {
                    queue.push(children[x]);
                    getRecursive(children[x]);
                }
            };

            getRecursive(root);

            res.send({ doc: queue });
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
        var decoded = req.decoded;
        var userId = decoded.userId;

        Journal.find({}, 'fileName')
            .exec(function (err, data) {
                res.send({
                    doc: data
                });
            });
    });

    //TODO jwtauth.authenticate не работает
    app.post('/api/protected/journal/upload', function (req, res, next) {
        upload.single('doc')(req, res, function (err) {
            if (err) {
                return
            }

            var file = req.file;
            var token = req.cookies.token;
            var decoded = jwtauth.decode(token);
            var userId = decoded.userId;

            //save into db
            var doc = new Journal({
                name: file.originalname,
                user: userId,
                fileName: file.filename,
                originalFileName: file.originalname,
                parent: req.body.parentId,
                createDate: new Date(),
                isFolder: false
            });

            doc.save();
        });

        res.setHeader("Content-type", "text/html");
        res.end("Скачано");
    });

    //del doc
    app.post('/api/protected/journal/del', jwtauth.authenticate, function (req, res) {
        Journal.findOne({ _id: req.body.id }, function (err, doc) {
            doc.remove(function (err, doc) {
                var fileName = req.body.fileName;
                fs.exists('./public/uploads/' + fileName, function (exists) {
                    if (exists) {
                        console.log('file deleted');
                        fs.unlink('./public/uploads/' + fileName);
                    } else {
                        console.log('file not exists');
                    }

                });
            });
        });

        res.send({ message: "Файл удален" });
    });

    //ad doc folder
    app.post('/api/protected/journal/add_folder', jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var userId = decoded.userId;

        var doc = new Journal({
            name: req.body.name,
            user: userId,
            parent: req.body.parent_id,
            createDate: new Date(),
            isFolder: true
        });
        doc.save();

        res.send({ message: "Папка добавлена" });
    });
};