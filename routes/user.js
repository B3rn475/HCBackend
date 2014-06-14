/*jslint node: true, nomen: true, es5: true */
"use strict";

var User = require("../models/user.js").model,
    index = require("./index.js");

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
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, User, obj);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, User, obj);
        }
    });
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
    route: {}
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
    index.body.mandatory.integer(req, res, next, "app_user_id", 0);
};

exports.body.optional.app_user_id = function (req, res, next) {
    index.body.optional.integer(req, res, next, "app_user_id", 0);
};