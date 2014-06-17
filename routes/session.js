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
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Session);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Session);
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

exports.routes.addAction = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var session = req.attached.session,
                    action = req.attached.action;
                if (_.contains(session.actions, action.id)) {
                    res.send({ status: "OK" });
                } else {
                    session.actions.push(action.id);
                    session.save(function (err, session) {
                        if (err) {
                            next(err);
                        } else {
                            res.send({ status: "OK" });
                        }
                    });
                }
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
 * Checkers
 */

exports.checkers = {};

exports.checkers.open = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.attached.session.ended_at) {
                res.send(400, { status: "KO", error: "Session " + req.attached.session.id + " is already closed" });
            } else {
                next();
            }
        }
    });
};