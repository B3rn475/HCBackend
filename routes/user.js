/*jslint node: true, nomen: true, es5: true */
"use strict";

var User = require("../models/user.js").model,
    index = require("./index.js");

exports.regexp.app_user_id = /[]

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, User);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, User);
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
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, User);
        },
        json: function () {
            index.algorithms.json.get(req, res, next, User);
        }
    });
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
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, User);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, User);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, User, inId);
};

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

exports.body.mandatory.id = function (req, res, next) {
    index.body.mandatory.id(req, res, next, User);
};

exports.body.optional.id = function (req, res, next) {
    index.body.optional.id(req, res, next, User);
};

exports.body.mandatory.app_id = function (req, res, next) {
    index.body.mandatory.integer(req, res, next, "app_id", 0);
};

exports.body.optional.app_id = function (req, res, next) {
    index.body.optional.integer(req, res, next, "app_id", 0);
};

exports.body.mandatory.app_user_id = function (req, res, next) {
    index.body.mandatory.string(req, res, next, "app_user_id");
};

exports.body.optional.app_user_id = function (req, res, next) {
    index.body.optional.string(req, res, next, "app_user_id");
};

exports.body.mandatory.quality = function (req, res, next) {
    index.body.mandatory.float(req, res, next, "quality");
};

exports.body.optional.quality = function (req, res, next) {
    index.body.optional.float(req, res, next, "quality");
};

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