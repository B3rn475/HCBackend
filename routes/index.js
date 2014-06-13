/*jslint node: true, nomen: true, es5: true */
"use strict";

exports.routes = {};
exports.query = {};

exports.routes.index = function (req, res) {
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

exports.routes.invalidRoute = function (req, res) {
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

exports.query.count = function (req, res, next) {
    var error;
    if (req.query.count === undefined) {
        req.count = 100;
    } else {
        req.count = parseInt(req.query.count, 10);
        if (req.query.count !== req.count.toString()) {
            error = "Invalid 'count' parameter, it is not a number";
        } else {
            if (req.count < 1 || req.count > 100) {
                error = "Invalid 'count' parameter, out of bound";
            }
        }
    }
    if (error) {
        res.format({
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send(400, { status: "KO", error: error});
            }
        });
    } else {
        next();
    }
};

exports.query.max_id = function (req, res, next) {
    var error;
    if (req.query.max_id !== undefined) {
        req.max_id = parseInt(req.query.max_id, 10);
        if (req.query.max_id !== req.max_id.toString()) {
            error = "Invalid 'max_id' parameter, it is not a number";
        } else {
            if (req.max_id < 0) {
                error = "Invalid 'max_id' parameter, out of bound";
            }
        }
    }
    if (error) {
        res.format({
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send(400, { status: "KO", error: error});
            }
        });
    } else {
        next();
    }
};

exports.query.since_id = function (req, res, next) {
    var error;
    if (req.query.since_id !== undefined) {
        req.since_id = parseInt(req.query.since_id, 10);
        if (req.query.since_id !== req.since_id.toString()) {
            error = "Invalid 'since_id' parameter, it is not a number";
        } else {
            if (req.since_id < 0) {
                error = "Invalid 'since_id' parameter, out of bound";
            }
        }
    }
    if (error) {
        res.format({
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send(400, { status: "KO", error: error});
            }
        });
    } else {
        next();
    }
};