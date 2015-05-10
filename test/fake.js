var bigrest = require("../index");

var http = bigrest.simulator({
    debug: true,
    basepath: __dirname
});

http.request('GET', "/test", {key: "33"}, function(code, data) {
    console.log(code, data);
});

http.request("POST", "/test2", {key: "te2"}, function(code, data) {
    console.log(code, data);
});

http.request("GET", "/test3", {key: "test3"}, function(code, data) {
    console.log(code, data);
});
