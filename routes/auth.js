var crypto = require("crypto");
var jwtauth = require("../lib/jwtauth");
var mongoose = require("mongoose");

module.exports = function (app) {
    var User = mongoose.model("User");

    //***********************************************************
    //**********************register*****************************
    //***********************************************************
    app.get("/register", function (req, res) {
        res.render("register");
    });

    app.post("/api/register", function (req, res, next) {
        //console.info("reg");

        var login = jwtauth.htmlEscape(req.body.login); //XSS!!!!
        var password = jwtauth.htmlEscape(req.body.password); //XSS!!!!
        var confirmPassword = jwtauth.htmlEscape(req.body.confirmPassword); //XSS!!!!

        if (password == confirmPassword && login.length > 0 && password.length > 0) {
            //create user
            var salt = crypto.randomBytes(128).toString("hex");
            var hash = crypto.pbkdf2Sync(password, salt, 10000, 512).toString("hex");
            var user = new User({
                email: login,
                hash: hash, // + salt,//todo
                salt: salt,
                roles: ["user"],
                createDate: new Date()
            });
            user.save(function (e, doc) {
                if (e) {
                    console.info(e.err);
                    res.json({ success: false, message: 'user not created. ' + e.err });
                } else {
                    //console.info("user created. _id: ", doc._id);
                    //cookie = 1 day
                    var payload = {
                        userId: doc._id,
                        roles: user.roles,
                        email: user.email
                    };
                    var token = jwtauth.sign(payload);
                    res.cookie("token", token, { maxAge: 1 * 24 * 3600000, httpOnly: false }); //httpOnly = true -> can't read with document.cookie
                    res.json({ success: true, message: 'user created. ' });
                }
            });
        } else {
            res.json({ success: false, message: 'enter correct login and password' });
        }
    });

    //***********************************************************
    //**********************login********************************
    //***********************************************************
    app.get("/login", function (req, res) {
        res.render("login");
    });

    app.post("/api/login", function (req, res, next) {
        var login = jwtauth.htmlEscape(req.body.login); //XSS!!!!
        var password = jwtauth.htmlEscape(req.body.password); //XSS!!!!

        if (login.length > 0 && password.length > 0) {
            //find user
            User.findOne({ email: login }, function (err, docLogin) {
                if (err) {
                    res.json({ success: false, message: 'user not found' });
                } else {
                    if (docLogin === null) {
                        res.json({ success: false, message: 'user not found' });
                    } else {
                        var salt = docLogin.salt;
                        var dbHash = crypto.pbkdf2Sync(password, salt, 10000, 512).toString("hex");
                        //go
                        if (dbHash == docLogin.hash) {
                            var payload = {
                                userId: docLogin._id,
                                roles: docLogin.roles,
                                email: docLogin.email
                            };
                            var token = jwtauth.sign(payload);
                            //cookie = 1 day
                            res.cookie('token', token, { maxAge: 1 * 24 * 3600000, httpOnly: false }); //httpOnly = true -> can't read with document.cookie
                            res.json({ success: true, message: 'user logged' });
                        } else {
                            res.json({ success: false, message: 'password is wrong' });
                        }
                    }

                }
            });
        } else {
            res.json({ success: false, message: 'authentication failed' });
        }
    });


    //***********************************************************
    //**********************logout*******************************
    //***********************************************************
    app.post("/api/logout", function (req, res, next) {
        res.clearCookie('token');
        res.json({ success: true, message: 'user logout' });
        //res.redirect("/401");
    });
};

