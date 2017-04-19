module.exports = function (app) {
    app.get("/", function (req, res) {
        res.render("index");
    });

    app.get("/401", function (req, res) {
        res.render('/errors/401');
    });

    //...about
};