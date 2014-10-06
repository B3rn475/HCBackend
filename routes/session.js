/*jslint node: true, nomen: true, es5: true */
/**
 * Developed By Carlo Bernaschina (GitHub - B3rn475)
 * www.bernaschina.com
 *
 * Copyright (c) 2014 Politecnico di Milano  
 * www.polimi.it
 *
 * Distributed under the MIT Licence
 */
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
    var obj = {};
    if (req.attached.created_at) {
        obj.created_at = req.attached.created_at;
    }
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Session, obj);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Session, obj);
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
            res.status(501).send("not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var session = req.attached.session;
                if (req.attached.completed_at) {
                    session.completed_at = req.attached.completed_at;
                } else {
                    session.completed_at = new Date();
                }
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

exports.params.id = index.params.id(Session);

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.id = index.query.register(Session.pname, index.query.mandatory.id(Session), "id");

exports.query.optional.id = index.query.register(Session.pname, index.query.optional.id(Session), "id");

exports.query.mandatory.completed = index.query.register("completed", index.query.mandatory.boolean("completed"));

exports.query.optional.completed = index.query.register("completed", index.query.optional.boolean("completed"));

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: { }
};

exports.body.mandatory.id = index.body.mandatory.id(Session);

exports.body.optional.id = index.body.optional.id(Session);


/**
 * Checkers
 */

exports.checkers = {};

exports.checkers.open = function (req, res, next) {
    res.format({
        html: function () {
            res.status(501).send("not implemented");
        },
        json: function () {
            if (req.attached.session && req.attached.session.completed_at) {
                res.status(400).send({ status: "KO", error: "Session " + req.attached.session.id + " is already closed" });
            } else {
                next();
            }
        }
    });
};
