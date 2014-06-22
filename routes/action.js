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
    var query = { },
        fields = "";
    if (req.attached.type) { query.type = req.attached.type; }
    if (req.attached.validity !== undefined) { query.validity = req.attached.validity; }
    if (req.attached.completed !== undefined) {
        query.$or = [
            {type: "tagging", tag : {$exists: req.attached.completed}},
            {type: "segmentation", segmentation : {$exists: req.attached.completed}},
        ];
    }
    if (req.attached.image) { query.image = req.attached.image.id; }
    if (req.attached.tag) { query.tag = req.attached.tag.id; }
    if (req.attached.session) { query.session = req.attached.session.id; }
    if (req.attached.populate === undefined || !req.attached.populate) { fields = "-segmentation.points"; }
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Action, query, fields);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Action, query, fields);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {type : req.attached.type};
    if (req.attached.session) { obj.session = req.attached.session.id; }
    if (req.attached.image) { obj.image = req.attached.image.id; }
    if (req.attached.user) { obj.user = req.attached.user.id; }
    if (req.attached.tag) {
        obj.tag = req.attached.tag.id;
    }
    if (req.attached.points === undefined) {
        obj.segmentation = undefined;
    } else {
        obj.segmentation = { points: req.attached.points, quality: null };
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
    if (req.attached.completed !== undefined) {
        query.$or = [
            {type: "tagging", tag : {$exists: req.attached.completed}},
            {type: "segmentation", segmentation : {$exists: req.attached.completed}},
        ];
    }
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
    var query = {};
    if (req.attached.type) { query.type = req.attached.type; }
    if (req.attached.validity !== undefined) { query.validity = req.attached.validity; }
    if (req.attached.completed !== undefined) {
        query.$or = [
            {type: "tagging", tag : {$exists: req.attached.completed}},
            {type: "segmentation", segmentation : {$exists: req.attached.completed}},
        ];
    }
    if (req.attached.image) { query.image = req.attached.image.id; }
    if (req.attached.tag) { query.tag = req.attached.tag.id; }
    if (req.attached.session) { query.session = req.attached.session.id; }
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Action, query);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Action, query);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(Action);

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.type = index.query.register("type", index.query.mandatory.regexp("type", type, "Action Type"));

exports.query.optional.type = index.query.register("type", index.query.optional.regexp("type", type, "Action Type"));

exports.query.mandatory.validity = index.query.register("validity", index.query.mandatory.boolean("validity"));

exports.query.optional.validity = index.query.register("validity", index.query.optional.boolean("validity"));

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
        complete : {},
        update : {}
    }
};

exports.body.mandatory.id = index.body.mandatory.id(Action);

exports.body.optional.id = index.body.optional.id(Action);

exports.body.mandatory.type = index.body.mandatory.regexp("type", type, "Action Type");

exports.body.optional.type = index.body.optional.regexp("type", type, "Action Type");

exports.body.mandatory.validity = index.body.mandatory.boolean("validity");

exports.body.optional.validity = index.body.optional.boolean("validity");

exports.body.route.update.validity = function (req, res, next) {
    if (req.attached.action) {
        if (req.attached.action.type === "tagging" || req.attached.action.segmentation === undefined) {
            exports.body.mandatory.validity(req, res, next);
        } else {
            exports.body.optional.validity(req, res, next);
        }
    } else {
        next();
    }
};

exports.body.route.update.quality = (function () {
    var oFloat = index.body.optional.float("quality");
    return function (req, res, next) {
        if (req.attached.action && req.attached.action.type === "segmentation" && req.attached.action.segmentation !== undefined) {
            oFloat(req, res, next);
        } else {
            next();
        }
    };
}());

exports.body.route.add.tag = (function () {
    var mId = index.body.mandatory.id(Tag),
        oId = index.body.optional.id(Tag);
    return function (req, res, next) {
        if (req.attached.type === "segmentation") {
            mId(req, res, next);
        } else {
            oId(req, res, next);
        }
    };
}());

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

exports.body.route.add.points = (function () {
    var oArray = index.body.optional.array("points", checkPoint, mapPoint);
    return function (req, res, next) {
        if (req.attached.type === "segmentation") {
            oArray(req, res, next);
        } else {
            next();
        }
    };
}());

/**
 * Checkers
 */

exports.checkers = {
    routes: {}
};

exports.checkers.routes.update = function (req, res, next) {
    if (req.attached.action) {
        if (req.attached.action.type === "segmentation" && req.attached.action.segmentation !== undefined) {
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