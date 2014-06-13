/*jslint node: true, nomen: true, es5: true */
"use strict";

var fs = require("fs"),
    Mask = require("../models/mask.js").model,
    index = require("./index.js");

exports.routes = {};
exports.params = {};
exports.body = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Mask);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Mask);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {image: req.attached.image.id, tag: req.attached.tag.id, quality: req.attached.quality, segmentations: req.attached.segmentations},
        cb = function (mask, next) {
            fs.writeFile("./storage/mask/" + mask.id.toString() + ".png", new Buffer(req.body.payload, "base64"), next);
        };
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Mask, obj, cb);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Mask, obj, cb);
        }
    });
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Mask);
        },
        json: function () {
            var populate;
            if (req.attached.populate) {
                populate = ["image", "tag", "user"];
            }
            index.algorithms.json.get(req, res, next, Mask, populate);
        }
    });
};

exports.routes.update = function (req, res, next) {
    var mask = req.attached.mask;
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            mask.quality = req.attached.quality;
            mask.segmentations = req.attached.segmentations;
            mask.save(function (err, mask) {
                if (err) {
                    next(err);
                } else {
                    fs.writeFile("./storage/mask/" + mask.id.toString() + ".png", new Buffer(req.body.payload, "base64"), function (err) {
                        if (err) {
                            next(err);
                        } else {
                            res.send({ status: "OK"});
                        }
                    });
                }
            });
        }
    });
};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Mask, inId);
};

exports.body.payload = function (req, res, next) {
    index.body.base64_value(req, res, next, "payload");
};

exports.body.quality = function (req, res, next) {
    index.body.number_min_max_value(req, res, next, "quality");
};

exports.body.segmentations = function (req, res, next) {
    index.body.number_min_max_value(req, res, next, "segmentations");
};