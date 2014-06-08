/*jslint node: true, nomen: true, es5: true */
"use strict";

exports.index = function (req, res) {
    res.format({
        text: function () {
            res.send(501, "not implemented");
        },
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            res.send([]);
        }
    });
};