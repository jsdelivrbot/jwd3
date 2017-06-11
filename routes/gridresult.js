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

        Journal.findOne({ fileName: docName })
            .exec(function (err, data) {
                if (err) {
                    return res.render("errors/500");
                }

                if (!data) {
                    return res.render("errors/404");
                }

                if (data.operations.indexOf('view') === -1) {
                    return res.render("errors/403");
                }

                res.render("doc", {
                    docName: docName
                });
            });
    });

    app.post('/api/protected/journal/upload', function (req, res, next) {
        upload.single('doc')(req, res, function (err) {
            if (err) {
                return res.send({ success: false, message: "Ошибка при загрузке. \n" + err.message });
            }

            var oper = req.headers.oper;
            var fileName = req.headers.filename;
            var id = req.body.parentId;
            var file = req.file;
            var token = req.cookies.token;
            var decoded = jwtauth.decode(token);
            var userId = decoded.userId;

            //TODO operations
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
                    size: file.size,
                    operations: ['edit', 'del', 'view']
                });
                doc.save(function (err) {
                    if (err) {
                        return res.send({ success: false, message: "Ошибка при сохранении в бд" });
                    }

                    return res.send({ success: true, message: "Документ добавлен" });
                });
            };

            if (oper == "edit") {
                var newfile = './public/uploads/' + req.file.filename;
                var oldfile = './public/uploads/' + fileName;

                fs.unlink(oldfile, function (err) {
                    if (err) {
                        return res.send({ success: false, message: "Произошла ошибка при удалении" });
                    }

                    fs.rename(newfile, oldfile, function (err) {
                        if (err) {
                            return res.send({ success: false, message: "Произошла ошибка при переименовании" });
                        }

                        //save to db
                        Journal.findOne({ _id: id }, function (err, doc) {
                            if (err) {
                                return res.send({ success: false, message: "Произошла ошибка при поиске в бд" });
                            }

                            doc['name'] = file.originalname;
                            doc['originalFileName'] = file.originalname;
                            doc['createDate'] = new Date();
                            doc['user'] = userId;

                            doc.save(function (err) {
                                if (err) {
                                    return res.send({ success: false, message: "Произошла ошибка при сохранении в бд" });
                                }

                                return res.send({ success: true, message: "Документ обновлен" });
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
            var isFolder = data.isFolder;

            if (err || !data || (data.length === 0)) {
                return res.send({ success: false, message: "Произошла ошибка. Файл не найден" });
            }

            if (data.operations.indexOf('del') === -1) {
                return res.send({ success: false, message: "Нельзя удалить" });
            }

            data.remove(function (err, data) {
                var fileName = req.body.fileName;

                if (isFolder) {
                    return res.send({ success: true, message: "Файл удален" });
                }

                fs.exists('./public/uploads/' + fileName, function (exists) {
                    if (exists) {
                        fs.unlink('./public/uploads/' + fileName, function (err) {
                            if (err) {
                                return res.send({ success: false, message: "Ошибка при удалении" });
                            }

                            console.log(chalk.red('file deleted'));
                            return res.send({ success: true, message: "Файл удален" });
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
        var parent_id = req.body.parent_id;

        //folder id
        Journal.findOne({ _id: parent_id }, function (err, data) {
            if (err) {
                return res.send({ success: false, message: "Ошибка. Папка не найдена" });
            }

            if (!data || (data.operations.indexOf('add') === -1)) {
                return res.send({ success: false, message: "Нельзя добавить в эту папку" });
            }

            var doc = new Journal({
                name: req.body.name,
                user: userId,
                parent: req.body.parent_id, //folder id
                createDate: new Date(),
                isFolder: true,
                operations: ['add', 'edit', 'del', 'view']
            });
            doc.save(function (err) {
                if (err) {
                    res.send({ success: false, message: "Ошибка при добавлении папки" });
                }

                res.send({ success: true, message: "Папка добавлена" });
            });
        });
    });

    //edit doc folder
    app.post('/api/protected/journal/edit_folder', jwtauth.authenticate, function (req, res) {
        var decoded = req.decoded;
        var userId = decoded.userId;

        Journal.findOne({ _id: req.body.id })
            .exec(function (err, data) {
                if (err || data.length === 0) {
                    return res.send({ success: false, message: "Произошла ошибка. Файл не найден" });
                }

                if (data.operations.indexOf('edit') === -1) {
                    return res.send({ success: false, message: "Нельзя редактировать" });
                }

                data.name = req.body.name;
                data.save(function (err) {
                    if (err) {
                        return res.send({ success: false, message: "Произошла ошибка" });
                    }
                    return res.send({ success: true, message: "Папка изменена" });
                });
            });
    });
};