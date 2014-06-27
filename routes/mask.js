/*jslint node: true, nomen: true, es5: true */
/**
 * Developed By Carlo Bernaschina (B3rn475)
 * www.bernaschina.scom
 *
 * Copyright (c) 2014 Politecnico di Milano  
 * www.polimi.it
 *
 * Distributed under the MIT Licence
 */
"use strict";

var fs = require("fs"),
    Mask = require("../models/mask.js").model,
    index = require("./index.js");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    var conditions = {};
    if (req.attached.image) { conditions.image = req.attached.image.id; }
    if (req.attached.tag) { conditions.tag = req.attached.tag.id; }
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Mask, conditions);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Mask, conditions);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {quality: req.attached.quality, segmentations: req.attached.segmentations},
        cb = function (mask, next) {
            fs.writeFile("./storage/mask/" + mask.id.toString() + ".png", new Buffer(req.body.payload, "base64"), next);
        };
    if (req.attached.image !== undefined) { obj.image = req.attached.image.id; }
    if (req.attached.tag !== undefined) { obj.tag = req.attached.tag.id; }
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

exports.routes.count = function (req, res, next) {
    var conditions = {};
    if (req.attached.image) { conditions.image = req.attached.image.id; }
    if (req.attached.tag) { conditions.tag = req.attached.tag.id; }
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Mask, conditions);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Mask, conditions);
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
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
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
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(Mask);

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.body.mandatory.payload = index.body.mandatory.base64("payload");

exports.body.optional.payload = index.body.optional.base64("payload");

exports.body.mandatory.quality = index.body.mandatory.float("quality");

exports.body.optional.quality = index.body.optional.float("quality");

exports.body.mandatory.segmentations = index.body.mandatory.integer("segmentations", 1);

exports.body.optional.segmentations = index.body.optional.integer("segmentations", 1);