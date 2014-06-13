/*jslint node: true, nomen: true, es5: true */
"use strict";

var Action = require("../models/action.js").model,
    Segmentation = require("../models/segmentation.js").model,
    Tag = require("../models/tag.js").model,
    index = require("./index.js");

exports.routes = {};
exports.params = {};
exports.body = {};
exports.checkers = {};

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
    var obj = {image: req.attached.image.id,
                user: req.attached.user.id,
                type: req.attached.type};
    if (req.attached.tag) {
        obj.tag = req.attached.tag.id;
    }
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

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Action, inId);
};

exports.body.id = function (req, res, next) {
    index.body.id(req, res, next, Action);
};

exports.body.tag = function (req, res, next) {
    if (req.attached.type === "segmentation" || (req.attached.action && req.attached.action.type === "tagging")) {
        index.body.id(req, res, next, Tag);
    } else {
        next();
    }
};

exports.body.segmentation = function (req, res, next) {
    if (req.attached.action.type === "segmentation") {
        index.body.id(req, res, next, Segmentation);
    } else {
        next();
    }
};

exports.body.type = function (req, res, next) {
    index.body.regexp(req, res, next, "type", new RegExp("tagging|segmentation$"));
};

exports.checkers.open = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.attached.action.ended_at) {
                res.send(400, { status: "KO", error: "Action " + req.attached.action.id + " is already closed" });
            } else {
                next();
            }
        }
    });
};