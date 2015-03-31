var bigrest = require("../index");

bigrest.listen(8080, {
    debug: true,
    basepath: __dirname,
    rootwork: function(req, res) {
        res.send("It working...");
    }
});
