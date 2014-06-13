/*jslint node: true, nomen: true, es5: true */
"use strict";

var fs = require("fs"),
    Image = require("../models/image.js").model,
    index = require("./index.js");

exports.routes = {};
exports.params = {};
exports.body = {};

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

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Image, inId);
};

exports.body.id = function (req, res, next) {
    index.body.id(req, res, next, Image);
};

exports.body.width = function (req, res, next) {
    index.body.number_min_max_value(req, res, next, "width", 1);
};

exports.body.height = function (req, res, next) {
    index.body.number_min_max_value(req, res, next, "height", 1);
};

exports.body.payload = function (req, res, next) {
    index.body.base64_value(req, res, next, "payload");
};