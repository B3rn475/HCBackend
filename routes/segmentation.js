/*jslint node: true, nomen: true, es5: true */
"use strict";

var Segmentation = require("../models/segmentation.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

exports.routes = {};
exports.params = {};
exports.body = {};

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

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Segmentation, inId);
};

var checkInteger = function (int, min, max) {
    if (_.isUndefined(int)) { return false; }
    if (!_.isNumber(int)) { return false; }
    if (Math.floor(int) !== int) { return false; }
    if (min && int < min) { return false; }
    if (max && int > max) { return false; }
    return true;
};

exports.body.points = function (req, res, next) {
    index.body.array(req, res, next, "points", function (item) {
        if (!checkInteger(item.x, 0)) { return false; }
        if (!checkInteger(item.y, 0)) { return false; }
        if (_.isUndefined(item.color)) { return false; }
        if (!checkInteger(item.color.r, 0, 255)) { return false; }
        if (!checkInteger(item.color.g, 0, 255)) { return false; }
        if (!checkInteger(item.color.b, 0, 255)) { return false; }
        if (!_.isBoolean(item.removed)) { return false; }
        return true;
    }, function (item) {
        return {
            x: item.x,
            y: item.y,
            color: {r: item.color.r, g: item.color.g, b: item.color.b},
            removed: item.removed
        };
    });
};