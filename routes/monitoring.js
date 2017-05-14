module.exports = function (app) {
    app.get("/monitoring", function (req, res) {
        res.render("monitoring");
    });
};