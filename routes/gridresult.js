var jwtauth = require("../lib/jwtauth");
var fs = require('fs');
var path = require('path');
var multer = require('multer');
var _ = require("../lib/underscore/underscore.js");
var mongoose = require("mongoose");

module.exports = function (app) {

    //upload
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '-' + Date.now());
        }
    });
    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            var ext = path.extname(file.originalname);

            if (ext !== '.pdf') {
                return callback(new Error('Только .pdf'))
            }

            callback(null, true)
        }
    });


    var Journal = mongoose.model("Journal");

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

        Journal.find({}).populate('user', 'email').exec(function (err, docs) {
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

    app.post('/api/protected/journal/upload', function (req, res, next) {
        upload.single('doc')(req, res, function (err) {
            if (err) {
                res.setHeader("Content-type", "text/html");
                return res.end(err.message);
            }

            var oper = req.headers.oper;
            var fileName = req.headers.filename;
            var id = req.body.parentId;

            var file = req.file;
            var token = req.cookies.token;
            var decoded = jwtauth.decode(token);
            var userId = decoded.userId;

            if (oper === "add") {
                //save into db
                var doc = new Journal({
                    name: file.originalname,
                    user: userId,
                    fileName: file.filename,
                    originalFileName: file.originalname,
                    parent: id,
                    createDate: new Date(),
                    isFolder: false
                });
                doc.save();

                res.setHeader("Content-type", "text/html");
                return res.end("Документ добавлен");
            };

            //console.info('old=', fileName, ', new=', req.file.filename);
            if (oper == "edit") {
                var newfile = './public/uploads/' + req.file.filename;
                var oldfile = './public/uploads/' + fileName;

                fs.unlink(oldfile, function (err) {
                    if (err) {
                        res.setHeader("Content-type", "text/html");
                        return res.end("Произошла ошибка при удалении");
                    }

                    fs.rename(newfile, oldfile, function (err) {
                        if (err) {
                            console.info('err, ', err);
                            res.setHeader("Content-type", "text/html");
                            return res.end("Произошла ошибка при переименовании");
                        }

                        //save to db
                        Journal.findOne({ _id: id }, function (err, doc) {
                            if (err) {
                                res.setHeader("Content-type", "text/html");
                                return res.end("Произошла ошибка при поиске в бд");
                            }

                            doc['name'] = file.originalname;
                            doc['originalFileName'] = file.originalname;
                            doc['createDate'] = new Date();
                            doc['user'] = userId;

                            doc.save(function (err) {
                                if (err) { 
                                    res.setHeader("Content-type", "text/html");
                                    return res.end("Произошла ошибка при сохранении в бд");
                                }

                                res.setHeader("Content-type", "text/html");
                                return res.end("Документ обновлен");
                            });
                        });
                    });
                });
            }
        });
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

    //add doc folder
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

    //edit doc folder
    app.post('/api/protected/journal/edit_folder', jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var userId = decoded.userId;

        Journal.findOne({ _id: req.body.id }, 'fileName')
            .exec(function (err, data) {
                if (err || data.length === 0) {
                    return res.send({ message: "Произошла ошибка" });
                }

                data.name = req.body.name;
                data.save(function (err) {
                    if (err) {
                        return res.send({ message: "Произошла ошибка" });
                    }
                    return res.send({ message: "Папка изменена" });
                });
            });
    });
};