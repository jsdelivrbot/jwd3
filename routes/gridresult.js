var jwtauth = require("../lib/jwtauth");
var fs = require('fs');
var path = require('path');
var multer = require('multer');
var _ = require("../lib/underscore/underscore.js");
var mongoose = require("mongoose");
var chalk = require('chalk');

module.exports = function (app) {

    //upload
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            //console.info('file=', file);
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

        mongoose.connection.db.eval("getNodeHierarchy()", function (err, docs) {
            res.send({ doc: docs });
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

                /*if(!('view' in data.operation)) {
                    res.render("errors/404");
                    return;
                }*/

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
        //console.log(chalk.red(JSON.stringify(req.headers)));
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
                    isFolder: false,
                    journalType: 0,
                    isReadonly: false,
                    operation: ['edit', 'del', 'view']
                });
                doc.save(function (err) {
                    if (err) {
                        res.setHeader("Content-type", "text/html");
                        return res.end("Ошибка при сохранении в бд");
                    }

                    res.setHeader("Content-type", "text/html");
                    return res.end("Документ добавлен");
                });
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
        Journal.findOne({ _id: req.body.id }, function (err, data) {
            if (err || data.length === 0) {
                return res.send({ success: false, message: "Произошла ошибка. Файл не найден" });
            }

            //if (('isReadonly' in data) && data['isReadonly']) {
            //    return res.send({ message: "Нельзя удалить", success: false });
            //}

            data.remove(function (err, data) {
                var fileName = req.body.fileName;
                fs.exists('./public/uploads/' + fileName, function (exists) {
                    if (exists) {
                        fs.unlink('./public/uploads/' + fileName, function (err) {
                            if (err) {
                                return res.send({ message: "Ошибка при удалении", success: false });
                            }

                            console.log(chalk.red('file deleted'));
                            return res.send({ message: "Файл удален", success: true });
                        });
                    } else {
                        console.log('file not exists');
                    }

                });
            });
        });
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
            isFolder: true,
            isReadonly: false,
            operations: ['add', 'edit', 'del', 'view']
        });
        doc.save(function (err) {
            if (err) {
                res.send({ message: "Ошибка при добавлении папки" });
            }

            res.send({ message: "Папка добавлена" });
        });
    });

    //edit doc folder
    app.post('/api/protected/journal/edit_folder', jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var userId = decoded.userId;

        Journal.findOne({ _id: req.body.id })
            .exec(function (err, data) {
                if (err || data.length === 0) {
                    return res.send({ message: "Произошла ошибка. Файл не найден" });
                }

                if (('isReadonly' in data) && data['isReadonly']) {//operation
                    return res.send({ message: "Нельзя редактировать" });
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