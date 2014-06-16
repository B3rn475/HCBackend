/*jslint node: true, nomen: true, es5: true */
"use strict";

var Action = require("../models/action.js").model,
    Segmentation = require("../models/segmentation.js").model,
    Tag = require("../models/tag.js").model,
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
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Action);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Action);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {type : req.attached.type};
    if (req.attached.image) { obj.image = req.attached.image.id; }
    if (req.attached.user) { obj.user = req.attached.user.id; }
    if (req.attached.tag) { obj.tag = req.attached.tag.id; }
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Action, obj);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Action, obj);
        }
    });
};

exports.routes.close = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var action = req.attached.action;
                if (action.type === "tagging") {
                    action.tag = req.attached.tag.id;
                }
                if (action.type === "segmentation") {
                    action.segmentation = req.attached.segmentation.id;
                }
                action.ended_at = new Date();
                action.save(function (err, action) {
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

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Action);
        },
        json: function () {
            var populate;
            if (req.attached.populate) {
                populate = ["image", "tag", "user", "segmentation"];
            }
            index.algorithms.json.get(req, res, next, Action, populate);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Action, inId);
};

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {
        add : {},
        close : {}
    }
};

exports.body.mandatory.id = function (req, res, next) {
    index.body.mandatory.id(req, res, next, Action);
};

exports.body.optional.id = function (req, res, next) {
    index.body.optional.id(req, res, next, Action);
};

exports.body.route.add.tag = function (req, res, next) {
    if (req.attached.type === "segmentation") {
        index.body.mandatory.id(req, res, next, Tag);
    } else {
        next();
    }
};

exports.body.route.close.tag = function (req, res, next) {
    if (req.attached.action && req.attached.action.type === "tagging") {
        index.body.mandatory.id(req, res, next, Tag);
    } else {
        next();
    }
};

exports.body.route.close.segmentation = function (req, res, next) {
    if (req.attached.action
            && req.attached.action.type === "segmentation") {
        index.body.id(req, res, next, Segmentation);
    } else {
        next();
    }
};

exports.body.mandatory.type = function (req, res, next) {
    index.body.mandatory.regexp(req, res, next, "type", type, "Action Type");
};

exports.body.optional.type = function (req, res, next) {
    index.body.optional.regexp(req, res, next, "type", type, "Action Type");
};

/**
 * Checkers
 */

exports.checkers = {};

exports.checkers.open = function (req, res, next) {
    if (req.attached.action && req.attached.action.ended_at) {
        req.errors.push({location: "status", message: "Action " + req.attached.action.id + " is already closed" });
    }
    next();
};