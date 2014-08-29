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
            res.status(501).send("not implemented");
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
    var query = {};
    if (req.attached.task) { query.task = req.attached.task.id; }
    if (req.attached.completed !== undefined) { query.completed_at = {$exists: req.attached.completed }; }
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Microtask, query);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Microtask, query);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(Microtask);

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.completed = index.query.register("completed", index.query.mandatory.boolean("completed"));

exports.query.optional.completed = index.query.register("completed", index.query.optional.boolean("completed"));

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

exports.body.mandatory.id = index.body.mandatory.id(Microtask);

exports.body.optional.id = index.body.optional.id(Microtask);

exports.body.mandatory.type = index.body.mandatory.regexp("type", type, "Microtask Type");

exports.body.optional.type = index.body.optional.regexp("type", type, "Microtask Type");

exports.body.mandatory.order = index.body.mandatory.integer("order", 0);

exports.body.optional.order = index.body.optional.integer("order", 0);

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