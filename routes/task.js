/*jslint node: true, nomen: true, es5: true */
"use strict";

var Task = require("../models/task.js").model,
    Microtask = require("../models/microtask.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    var query = {};
    if (req.attached.image) { query.image = req.attached.image.id; }
    if (req.attached.collection) { query.image = { $in: req.attached.collection.images}; }
    if (req.attached.completed !== undefined) { query.completed_at = {$exists: req.attached.completed}; }
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Task, query);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Task, query);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = { };
    if (req.attached.image !== undefined) { obj.image = req.attached.image.id; }
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Task, obj);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Task, obj);
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
                var task = req.attached.task;
                task.completed_at = new Date();
                task.save(function (err, task) {
                    if (err) {
                        next(err);
                    } else {
                        var query = {completed_at: {$exists: false}, task: task.id},
                            update = {$set: {completed_at: new Date()}},
                            options = {multi: true};
                        Microtask.update(query, update, options, function (err) {
                            if (err) {
                                next(err);
                            } else {
                                res.send({status: "OK"});
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
            index.algorithms.html.get(req, res, next, Task);
        },
        json: function () {
            var populate;
            if (req.attached.populate) {
                populate = ["image", "users", "microtasks"];
            }
            index.algorithms.json.get(req, res, next, Task, populate);
        }
    });
};

exports.routes.count = function (req, res, next) {
    var query = {};
    if (req.attached.image) { query.image = req.attached.image.id; }
    if (req.attached.collection) { query.image = { $in: req.attached.collection.images}; }
    if (req.attached.completed !== undefined) { query.completed_at = {$exists: req.attached.completed}; }
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Task, query);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Task, query);
        }
    });
};

exports.routes.addUser = function (req, res, next) {
    var query = {},
        update = {},
        options = {};
    if (req.attached.task) { query._id = req.attached.task.id; }
    if (req.attached.user) { update = {$addToSet: {users: req.attached.user.id }}; }
    res.format({
        html: function () {
            index.algorithms.html.update(req, res, next, Task, query, update, options);
        },
        json: function () {
            index.algorithms.json.update(req, res, next, Task, query, update, options);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(Task);

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.id = index.query.register(Task.pname, index.query.mandatory.id(Task), "id");

exports.query.optional.id = index.query.register(Task.pname, index.query.optional.id(Task), "id");

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

exports.body.mandatory.id = index.body.mandatory.id(Task);

exports.body.optional.id = index.body.optional.id(Task);

/**
 * Checkers
 */

exports.checkers = {
    route: {}
};

exports.checkers.open = function (req, res, next) {
    if (req.attached.task && req.attached.task.completed_at) {
        req.errors.push({location: "status", message: "Task " + req.attached.action.id + " is already closed" });
    }
    next();
};

exports.checkers.route.index = function (req, res, next) {
    if (req.attached.image && req.attached.collection) {
        req.errors.push({location: "query", name: "image|collection", message: "Cannot set both Image and Collection as filter" });
    }
    next();
};