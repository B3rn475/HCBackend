/*jslint node: true, nomen: true, es5: true */
"use strict";

exports.index = function (req, res) {
    res.format({
        text: function () {
            res.send('server up and running');
        },
        html: function () {
            res.send('server up and running');
        },
        json: function () {
            res.send({ status: "OK", message: 'server up and running' });
        }
    });
};

exports.invalidRoute = function (req, res) {
    res.format({
        text: function () {
            res.send(404, 'invalid route');
        },
        html: function () {
            res.send(404, 'invalid route');
        },
        json: function () {
            res.send(404, { error: 'invalid route' });
        }
    });
};