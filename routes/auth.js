var crypto = require("crypto");
var jwtauth = require("../lib/jwtauth");
//var User = require("../models/User");

module.exports = function (app, mongoose) {
    var User = require("../models/User")(mongoose);

    //***********************************************************
    //**********************register*****************************
    //***********************************************************
    app.get("/register", function (req, res) {
        res.render("register");
    });

    app.post("/api/register", function (req, res, next) {
        //console.info("reg");

        var login = req.body.login; //XSS!!!!
        var password = req.body.password; //XSS!!!!
        var confirmPassword = req.body.confirmPassword; //XSS!!!!

        if (password == confirmPassword && login.length > 0 && password.length > 0) {
            //create user
            var salt = crypto.randomBytes(128).toString("hex");
            var hash = crypto.pbkdf2Sync(password, salt, 10000, 512).toString("hex");
            var user = new User({
                email: login,
                hash: hash, // + salt,//todo
                salt: salt,
                roles: ["user"]
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
                    res.cookie("token", token, { maxAge: 1 * 24 * 3600000, httpOnly: true });
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
        var login = req.body.login; //XSS!!!!
        var password = req.body.password; //XSS!!!!

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
                            res.cookie('token', token, { maxAge: 1 * 24 * 3600000, httpOnly: true });
                            res.json({ success: true, message: 'user login' });
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

