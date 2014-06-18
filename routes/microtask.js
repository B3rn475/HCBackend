/*jslint node: true, nomen: true, es5: true */
"use strict";

var Microtask = require("../models/microtask.js").model,
    Task = require("../models/task.js").model,
    index = require("./index.js");

/**
 * RegExps
 */

var type = /tagging|segmentation$/;

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    var query = {};
    if (req.attached.task) { query.task = req.attached.task.id; }
    if (req.attached.completed !== undefined) { query.completed_at = {$exists: req.attached.completed }; }
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Microtask, query);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Microtask, query);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {type: req.attached.type, order: req.attached.order };
    if (req.attached.task) { obj.task = req.attached.task.id; }
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Microtask, obj);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Microtask, obj);
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
                var microtask = req.attached.microtask;
                microtask.completed_at = new Date();
                microtask.action = req.attached.action.id;
                microtask.save(function (err, microtask) {
                    if (err) {
                        next(err);
                    } else {
                        Microtask.count({task: microtask.task, completed_at : {$exists: false}}, function (err, count) {
                            if (err) {
                                next(err);
                            } else {
                                if (count === 0) {
                                    Task.update({_id: microtask.task}, {$set: {completed_at: microtask.completed_at}}, function (err) {
                                        if (err) {
                                            next(err);
                                        } else {
                                            res.send({status: "OK"});
                                        }
                                    });
                                } else {
                                    next();
                                }
                            }
                        });
                    }
                });
            }
        }
    });
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Microtask);
        },
        json: function () {
            index.algorithms.json.get(req, res, next, Microtask);
        }
    });
};

exports.routes.count = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Microtask);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Microtask);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Microtask, inId);
};

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
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
    route: {
        add : {},
        complete : {}
    }
};

exports.body.mandatory.id = function (req, res, next) {
    index.body.mandatory.id(req, res, next, Microtask);
};

exports.body.optional.id = function (req, res, next) {
    index.body.optional.id(req, res, next, Microtask);
};

exports.body.mandatory.type = function (req, res, next) {
    index.body.mandatory.regexp(req, res, next, "type", type, "Microtask Type");
};

exports.body.optional.type = function (req, res, next) {
    index.body.optional.regexp(req, res, next, "type", type, "Microtask Type");
};

exports.body.mandatory.order = function (req, res, next) {
    index.body.mandatory.integer(req, res, next, "order", 0);
};

exports.body.optional.order = function (req, res, next) {
    index.body.optional.integer(req, res, next, "order", 0);
};

/**
 * Checkers
 */

exports.checkers = {};

exports.checkers.open = function (req, res, next) {
    if (req.attached.microtask && req.attached.microtask.completed_at) {
        req.errors.push({location: "status", message: "Microtask " + req.attached.microtask.id + " is already completed" });
    }
    next();
};