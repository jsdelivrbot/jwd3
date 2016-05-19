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
        res.redirect("/login");

        //res.json({
        //    success: false,
        //    message: "token missing!"
        //});
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