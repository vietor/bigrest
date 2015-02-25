var bigrest = require("../index");

var http = bigrest.simulator({
    debug: true,
    basepath: __dirname
});

http.request("/test", {key: "fake"}, function(code, data) {
    console.log(code, data);
});
