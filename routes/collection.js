/*jslint node: true, nomen: true, es5: true */
"use strict";

var Collection = require("../models/collection.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Collection);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Collection);
        }
    });
};

exports.routes.add = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Collection);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Collection);
        }
    });
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Collection);
        },
        json: function () {
            var populate;
            if (req.attached.populate) {
                populate = "images";
            }
            index.algorithms.json.get(req, res, next, Collection, populate);
        }
    });
};

exports.routes.addImage = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var collection = req.attached.collection,
                    image = req.attached.image;
                if (_.contains(collection.images, image.id)) {
                    res.send({ status: "OK" });
                } else {
                    collection.images.push(image.id);
                    collection.save(function (err, collection) {
                        if (err) {
                            next(err);
                        } else {
                            res.send({ status: "OK" });
                        }
                    });
                }
            }
        }
    });
};

exports.routes.removeImage = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var collection = req.attached.collection,
                    image = req.attached.image;
                if (_.contains(collection.images, image.id)) {
                    collection.images = _.without(collection.images, image.id);
                    collection.save(function (err, collection) {
                        if (err) {
                            next(err);
                        } else {
                            res.send({ status: "OK" });
                        }
                    });
                } else {
                    res.send({ status: "OK" });
                }
            }
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Collection, inId);
};