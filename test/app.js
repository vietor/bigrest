var bigrest = require("../index");

var port = 8080;

bigrest.listen(port, {
    debug: true,
    basepath: __dirname,
    rootwork: function(req, res) {
        res.send("It working...");
    }
}, function() {
    console.log('Running on ' + port + ' ...');
});
