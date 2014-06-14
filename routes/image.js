/*jslint node: true, nomen: true, es5: true */
"use strict";

var fs = require("fs"),
    Image = require("../models/image.js").model,
    index = require("./index.js");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Image);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Image);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {width: req.attached.width, height: req.attached.height},
        cb = function (image, next) {
            fs.writeFile("./storage/image/" + image.id.toString() + ".jpg", new Buffer(req.attached.payload, "base64"), next);
        };
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Image, obj, cb);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Image, obj, cb);
        }
    });
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Image);
        },
        json: function () {
            index.algorithms.json.get(req, res, next, Image);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Image, inId);
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
    index.body.mandatory.id(req, res, next, Image);
};

exports.body.optional.id = function (req, res, next) {
    index.body.optional.id(req, res, next, Image);
};

exports.body.mandatory.width = function (req, res, next) {
    index.body.mandatory.integer(req, res, next, "width", 1);
};

exports.body.optional.width = function (req, res, next) {
    index.body.optional.integer(req, res, next, "width", 1);
};

exports.body.mandatory.height = function (req, res, next) {
    index.body.mandatory.integer(req, res, next, "height", 1);
};

exports.body.optional.height = function (req, res, next) {
    index.body.optional.integer(req, res, next, "height", 1);
};

exports.body.mandatory.payload = function (req, res, next) {
    index.body.mandatory.base64(req, res, next, "payload");
};

exports.body.optional.payload = function (req, res, next) {
    index.body.optional.base64(req, res, next, "payload");
};