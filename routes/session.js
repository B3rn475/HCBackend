/*jslint node: true, nomen: true, es5: true */
"use strict";

var Session = require("../models/session.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    var query = {};
    if (req.attached.completed !== undefined) { query.completed_at = {$exists: req.attached.completed}; }
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Session, query);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Session, query);
        }
    });
};

exports.routes.add = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Session);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Session);
        }
    });
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Session);
        },
        json: function () {
            var populate;
            if (req.attached.populate) {
                populate = "actions";
            }
            index.algorithms.json.get(req, res, next, Session, populate);
        }
    });
};

exports.routes.count = function (req, res, next) {
    var query = {};
    if (req.attached.completed !== undefined) { query.completed_at = {$exists: req.attached.completed}; }
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Session, query);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Session, query);
        }
    });
};

exports.routes.complete = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var session = req.attached.session;
                session.ended_at = new Date();
                session.save(function (err, action) {
                    if (err) {
                        next(err);
                    } else {
                        res.send({status: "OK"});
                    }
                });
            }
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Session, inId);
};

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.id = function (req, res, next) {
    index.query.mandatory.id(req, res, index.query.register(req, res, next, Session.pname, "id"), Session);
};

exports.query.optional.id = function (req, res, next) {
    index.query.optional.id(req, res, index.query.register(req, res, next, Session.pname, "id"), Session);
};

exports.query.mandatory.completed = function (req, res, next) {
    index.query.mandatory.boolean(req, res, index.query.register(req, res, next, "completed"), "completed");
};

exports.query.optional.completed = function (req, res, next) {
    index.query.optional.boolean(req, res, index.query.register(req, res, next, "completed"), "completed");
};

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: { }
};

exports.body.mandatory.id = function (req, res, next) {
    index.body.mandatory.id(req, res, next, Session);
};

exports.body.optional.id = function (req, res, next) {
    index.body.optional.id(req, res, next, Session);
};


/**
 * Checkers
 */

exports.checkers = {};

exports.checkers.open = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.attached.session && req.attached.session.completed_at) {
                res.send(400, { status: "KO", error: "Session " + req.attached.session.id + " is already closed" });
            } else {
                next();
            }
        }
    });
};