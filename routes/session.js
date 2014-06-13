/*jslint node: true, nomen: true, es5: true */
"use strict";

var Session = require("../models/session.js").model,
    index = require("./index.js");

exports.routes = {};
exports.params = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Session);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Session);
        }
    });
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Session);
        },
        json: function () {
            index.algorithms.json.get(req, res, next, Session);
        }
    });
};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Session, inId);
};