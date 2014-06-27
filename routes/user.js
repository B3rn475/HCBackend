/*jslint node: true, nomen: true, es5: true */
/**
 * Developed By Carlo Bernaschina (B3rn475)
 * www.bernaschina.scom
 *
 * Copyright (c) 2014 Politecnico di Milano  
 * www.polimi.it
 *
 * Distributed under the MIT Licence
 */
"use strict";

var User = require("../models/user.js").model,
    index = require("./index.js"),
    async = require("async");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    var conditions = {};
    if (req.attached.app_id !== undefined) { conditions.app_id = req.attached.app_id; }
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, User, conditions);
        },
        json: function () {
            var prepare;
            if (req.attached.populate) {
                prepare = function (users, next) {
                    var error;
                    async.map(users,
                        function (user, next) {
                            user.computeFields(next);
                        },
                        next);
                };
            }
            index.algorithms.json.list(req, res, next, User, conditions, undefined, undefined, prepare);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {app_id: req.attached.app_id, app_user_id: req.attached.app_user_id};
    if (req.attached.user === undefined) {
        res.format({
            html: function () {
                index.algorithms.html.add(req, res, next, User, obj);
            },
            json: function () {
                index.algorithms.json.add(req, res, next, User, obj);
            }
        });
    } else {
        res.format({
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send({ status: "OK", id: req.attached.user.id});
            }
        });
    }
};

exports.routes.get = function (req, res, next) {
    var count,
        total,
        end,
        cbNext = function (err) {
            if (err) {
                next(err);
            } else {
                res.format({
                    html: function () {
                        index.algorithms.html.get(req, res, next, User);
                    },
                    json: function () {
                        index.algorithms.json.get(req, res, next, User);
                    }
                });
            }
        };
    if (req.attached.user && req.attached.populate !== undefined && req.attached.populate) {
        req.attached.user.computeFields(cbNext);
    } else {
        cbNext();
    }
};

exports.routes.update = function (req, res, next) {
    var user = req.attached.user;
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                user.quality = req.attached.quality;
                user.save(function (err, user) {
                    if (err) {
                        next(err);
                    } else {
                        res.send({ status: "OK"});
                    }
                });
            }
        }
    });
};

exports.routes.count = function (req, res, next) {
    var conditions = {};
    if (req.attached.app_id !== undefined) { conditions.app_id = req.attached.app_id; }
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, User, conditions);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, User, conditions);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(User);

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.app_id = index.query.register("app_id", index.query.mandatory.integer("app_id", 0));

exports.query.optional.app_id = index.query.register("app_id", index.query.optional.integer("app_id", 0));

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {
        add: {}
    }
};

exports.body.mandatory.id = index.body.mandatory.id(User);

exports.body.optional.id = index.body.optional.id(User);

exports.body.mandatory.app_id = index.body.mandatory.integer("app_id", 0);

exports.body.optional.app_id = index.body.optional.integer("app_id", 0);

exports.body.mandatory.app_user_id = index.body.mandatory.string("app_user_id");

exports.body.optional.app_user_id = index.body.optional.string("app_user_id");

exports.body.mandatory.quality = index.body.mandatory.float("quality");

exports.body.optional.quality = index.body.optional.float("quality");

exports.body.route.add.exist = function (req, res, next) {
    if (req.attached.app_id !== undefined && req.attached.app_user_id !== undefined) {
        User.findOne({app_id: req.attached.app_id, app_user_id: req.attached.app_user_id }, function (err, user) {
            if (err) {
                next(err);
            } else {
                if (user) {
                    req.attached.user = user;
                }
                next();
            }
        });
    } else {
        next();
    }
};