/*jslint node: true, nomen: true, es5: true */
"use strict";

var Tag = require("../models/tag.js").model,
    index = require("./index.js");

exports.routes = {};
exports.params = {};
exports.body = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Tag);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Tag);
        }
    });
};

exports.routes.add = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Tag);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Tag);
        }
    });
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Tag);
        },
        json: function () {
            index.algorithms.json.get(req, res, next, Tag);
        }
    });
};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Tag, inId);
};

exports.body.id = function (req, res, next) {
    index.body.id(req, res, next, Tag);
};