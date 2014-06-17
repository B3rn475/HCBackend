/*jslint node: true, nomen: true, es5: true */
"use strict";

var Task = require("../models/task.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Task);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Task);
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

exports.routes.addMicrotask = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var task = req.attached.task,
                    microtask = req.attached.microtask;
                if (_.contains(task.microtasks, microtask.id)) {
                    res.send({ status: "OK" });
                } else {
                    task.microtasks.push(microtask.id);
                    task.save(function (err, task) {
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

exports.routes.addUser = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var task = req.attached.task,
                    user = req.attached.user;
                if (_.contains(task.users, user.id)) {
                    res.send({ status: "OK" });
                } else {
                    task.users.push(user.id);
                    task.save(function (err, task) {
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
    index.params.id(req, res, next, Task, inId);
};