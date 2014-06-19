/*jslint node: true, nomen: true, es5: true */
"use strict";

var Action = require("../models/action.js").model,
    color = require("../models/action.js").regexp.color,
    Tag = require("../models/tag.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

/**
 * RegExps
 */

var type = /tagging|segmentation$/;

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    var conditions = {},
        fields = "";
    if (req.attached.type) { conditions.type = req.attached.type; }
    if (req.attached.validity !== undefined) { conditions.validity = req.attached.validity; }
    if (req.attached.completed !== undefined) { conditions.completed_at = {$exists: req.attached.completed}; }
    if (req.attached.image) { conditions.image = req.attached.image.id; }
    if (req.attached.tag) { conditions.tag = req.attached.tag.id; }
    if (req.attached.session) { conditions.session = req.attached.session.id; }
    if (req.attached.populate === undefined || !req.attached.populate) { fields = "-segmentation.points"; }
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Action, conditions, fields);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Action, conditions, fields);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {type : req.attached.type};
    if (req.attached.session) { obj.session = req.attached.session.id; }
    if (req.attached.image) { obj.image = req.attached.image.id; }
    if (req.attached.user) { obj.user = req.attached.user.id; }
    if (req.attached.tag) { obj.tag = req.attached.tag.id; }
    if (req.attached.points !== undefined) { obj.segmentation = { points : req.attached.points}; }
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Action, obj);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Action, obj);
        }
    });
};

exports.routes.update = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var action = req.attached.action;
                if (req.attached.validity !== undefined) { action.validity = false; }
                if (req.attached.quality !== undefined && action.segmentation !== null) { action.segmentation.quality = req.attached.quality; }
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

exports.routes.validity = function (req, res, next) {
    var query = {},
        update = {$set: {validity: req.attached.validity}},
        options = {multi: true};
    if (req.attached.image) { query.image = req.attached.image.id; }
    if (req.attached.tag) { query.tag = req.attached.tag.id; }
    if (req.attached.type) { query.type = req.attached.type; }
    if (req.attached.session) { query.session = req.attached.session; }
    res.format({
        html: function () {
            index.algorithms.html.update(req, res, next, Action, query, update, options);
        },
        json: function () {
            index.algorithms.json.update(req, res, next, Action, query, update, options);
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

exports.routes.count = function (req, res, next) {
    var conditions = {};
    if (req.attached.type) { conditions.type = req.attached.type; }
    if (req.attached.validity !== undefined) { conditions.validity = req.attached.validity; }
    if (req.attached.completed !== undefined) { conditions.completed_at = {$exists: req.attached.completed}; }
    if (req.attached.image) { conditions.image = req.attached.image.id; }
    if (req.attached.tag) { conditions.tag = req.attached.tag.id; }
    if (req.attached.session) { conditions.session = req.attached.session.id; }
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Action, conditions);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Action, conditions);
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
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.type = function (req, res, next) {
    index.query.mandatory.regexp(req, res, index.query.register(req, res, next, "type"), "type", type, "Action Type");
};

exports.query.optional.type = function (req, res, next) {
    index.query.optional.regexp(req, res, index.query.register(req, res, next, "type"), "type", type, "Action Type");
};

exports.query.mandatory.validity = function (req, res, next) {
    index.query.mandatory.boolean(req, res, index.query.register(req, res, next, "validity"), next, "validity");
};

exports.query.optional.validity = function (req, res, next) {
    index.query.optional.boolean(req, res, index.query.register(req, res, next, "validity"), "validity");
};

exports.query.mandatory.completed = function (req, res, next) {
    index.query.mandatory.boolean(req, res, index.query.register(req, res, next, "completed"), next, "completed");
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
        complete : {},
        update : {}
    }
};

exports.body.mandatory.id = function (req, res, next) {
    index.body.mandatory.id(req, res, next, Action);
};

exports.body.optional.id = function (req, res, next) {
    index.body.optional.id(req, res, next, Action);
};

exports.body.mandatory.type = function (req, res, next) {
    index.body.mandatory.regexp(req, res, next, "type", type, "Action Type");
};

exports.body.optional.type = function (req, res, next) {
    index.body.optional.regexp(req, res, next, "type", type, "Action Type");
};

exports.body.mandatory.validity = function (req, res, next) {
    index.body.mandatory.boolean(req, res, next, "validity");
};

exports.body.optional.validity = function (req, res, next) {
    index.body.optional.boolean(req, res, next, "validity");
};

exports.body.route.update.validity = function (req, res, next) {
    if (req.attached.action) {
        if (req.attached.action.type === "tagging") {
            exports.body.mandatory.validity(req, res, next);
        }
        if (req.attached.action.type === "segmentation") {
            exports.body.optional.validity(req, res, next);
        }
    } else {
        next();
    }
};

exports.body.route.update.quality = function (req, res, next) {
    if (req.attached.action && req.attached.action.type === "segmentation") {
        index.body.optional.float(req, res, next, "quality");
    } else {
        next();
    }
};

exports.body.route.add.tag = function (req, res, next) {
    if (req.attached.type === "segmentation") {
        index.body.mandatory.id(req, res, next, Tag);
    } else {
        index.body.optional.id(req, res, next, Tag);
    }
};

var checkInteger = function (int, min, max) {
    if (_.isUndefined(int)) { return false; }
    if (!_.isNumber(int)) { return false; }
    if (Math.floor(int) !== int) { return false; }
    if (min && int < min) { return false; }
    if (max && int > max) { return false; }
    return true;
};

var checkPoint = function (item) {
    if (!checkInteger(item.x, 0)) { return false; }
    if (!checkInteger(item.y, 0)) { return false; }
    if (typeof item.color !== "string") { return false; }
    if (!color.test(item.color)) {return false; }
    if (!_.isBoolean(item.removed)) { return false; }
    return true;
};

var mapPoint = function (item) {
    return {
        x: item.x,
        y: item.y,
        color: {r: item.color.r, g: item.color.g, b: item.color.b},
        removed: item.removed
    };
};

exports.body.route.add.points = function (req, res, next) {
    if (req.attached.type === "segmentation") {
        index.body.optional.array(req, res, next, "points", checkPoint, mapPoint);
    } else {
        next();
    }
};

/**
 * Checkers
 */

exports.checkers = {
    routes: {}
};

exports.checkers.open = function (req, res, next) {
    if (req.attached.action && req.attached.action.completed_at) {
        req.errors.push({location: "status", message: "Action " + req.attached.action.id + " is already completed" });
    }
    next();
};

exports.checkers.completed = function (req, res, next) {
    if (req.attached.action && !req.attached.action.completed_at) {
        req.errors.push({location: "status", message: "Action " + req.attached.action.id + " is still open" });
    }
    next();
};

exports.checkers.routes.update = function (req, res, next) {
    if (req.attached.action) {
        if (req.attached.action.type === "segmentation") {
            if (req.attached.validity === undefined && req.attached.quality === undefined) {
                req.errors.push({location: "body", name: "validity|quality", message: "Missing validity or quality Body paramaters. At least one is required" });
            }
        }
    }
    next();
};

exports.checkers.routes.validity = function (req, res, next) {
    if (!(req.attached.image || req.attached.tag || req.attached.session)) {
        req.errors.push({location: "query", name: "image|tag|session", message: "Missing Image or Tag or Session id. At least one is required as filter" });
    }
    next();
};