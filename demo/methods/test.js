exports.test_throw = function(callback) {
    brcx.throwError();
    callback(null);
};
