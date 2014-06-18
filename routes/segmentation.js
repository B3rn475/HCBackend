/*jslint node: true, nomen: true, es5: true */
"use strict";

var Segmentation = require("../models/segmentation.js").model,
    color = require("../models/segmentation.js").regexp.color,
    index = require("./index.js"),
    _ = require("underscore-node");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Segmentation);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Segmentation);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {points: req.attached.points};
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Segmentation, obj);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Segmentation, obj);
        }
    });
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Segmentation);
        },
        json: function () {
            index.algorithms.json.get(req, res, next, Segmentation);
        }
    });
};

exports.routes.update = function (req, res, next) {
    var segmentation = req.attached.segmentation;
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                segmentation.quality = req.attached.quality;
                segmentation.save(function (err, user) {
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

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Segmentation, inId);
};

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {}
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

exports.body.mandatory.points = function (req, res, next) {
    index.body.mandatory.array(req, res, next, "points", checkPoint, mapPoint);
};

exports.body.optional.points = function (req, res, next) {
    index.body.optional.array(req, res, next, "points", checkPoint, mapPoint);
};

exports.body.mandatory.quality = function (req, res, next) {
    index.body.mandatory.float(req, res, next, "quality");
};

exports.body.optional.quality = function (req, res, next) {
    index.body.optional.float(req, res, next, "quality");
};