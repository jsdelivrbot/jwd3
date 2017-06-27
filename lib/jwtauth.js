var jwt = require("jsonwebtoken");
var conf = require("../conf");

//authentication express middleware
module.exports.authenticate = function (req, res, next) {
    //token from header
    //var token = req.headers["authorization"];
    //token from cookie
    var token = req.cookies.token;

    //var decoded = jwt.decode(token);
    //var userId = decoded.userId;

    //console.info("get token: ", token);

    //console.info(req.originalUrl, ', ', req.get('host'));

    if (token) {
        jwt.verify(token, conf.settings.secretKey, function (err, decoded) {
            if (err) {
                res.json({
                    success: false,
                    message: "token verification failed!"
                });
            } else {
                (req.decoded = decoded) && next();
            }
        });
    } else {
        //token missing
        res.redirect("/login?back=" + req.originalUrl);

        //res.json({
        //    success: false,
        //    message: "token missing!"
        //});
    }
};

module.exports.checkAuthenticate = function (req, res, cb) {
    var token = req.cookies.token;

    if (token) {
        jwt.verify(token, conf.settings.secretKey, function (err, decoded) {
            if (err) {
                cb({success: false,
                    message: "token verification failed!"});
            } else {
                cb({ success: true,
                    message: "token verification success!"});
            }
        });
    } else {
        cb({success: false,
            message: "token is missing!"});
    }
};

//signing function 1 day
module.exports.sign = function (payload) {
    return jwt.sign(payload, conf.settings.secretKey, {
        expiresIn: 1 * 24 * 3600000
    });
};

module.exports.decode = function (token) {
    return jwt.decode(token);//payload
};

module.exports.htmlEscape = function (text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')  // it's not neccessary to escape >
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};