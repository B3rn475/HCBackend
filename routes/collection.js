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

var Collection = require("../models/collection.js").model,
    name = require("../models/collection.js").regexp.name,
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
    var obj = {name: req.attached.name};
    if (req.attached.collection === undefined) {
        res.format({
            html: function () {
                index.algorithms.html.add(req, res, next, Collection, obj);
            },
            json: function () {
                index.algorithms.json.add(req, res, next, Collection, obj);
            }
        });
    } else {
        res.format({
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send({ status: "OK", id: req.attached.collection.id});
            }
        });
    }
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

exports.routes.count = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Collection);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Collection);
        }
    });
};

exports.routes.addImage = function (req, res, next) {
    var query = {},
        update = {},
        options = {};
    if (req.attached.collection) { query._id = req.attached.collection.id; }
    if (req.attached.image) { update = {$addToSet: {images: req.attached.image.id }}; }
    res.format({
        html: function () {
            index.algorithms.html.update(req, res, next, Collection, query, update, options);
        },
        json: function () {
            index.algorithms.json.update(req, res, next, Collection, query, update, options);
        }
    });
};

exports.routes.removeImage = function (req, res, next) {
    var query = {},
        update = {},
        options = {};
    if (req.attached.collection) { query._id = req.attached.collection.id; }
    if (req.attached.image) { update = {pull: {images: req.attached.image.id }}; }
    res.format({
        html: function () {
            index.algorithms.html.update(req, res, next, Collection, query, update, options);
        },
        json: function () {
            index.algorithms.json.update(req, res, next, Collection, query, update, options);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(Collection);

/**
 * Query Oarans
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.id = index.query.register(Collection.pname, index.query.mandatory.id(Collection), "id");

exports.query.optional.id = index.query.register(Collection.pname, index.query.optional.id(Collection), "id");

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {
        add: {}
    }
};

exports.body.route.add.name = index.body.mandatory.regexp("name", name, "Collection Name");

exports.body.route.add.exist = function (req, res, next) {
    if (req.attached.name) {
        Collection.findOne({name: req.attached.name }, function (err, collection) {
            if (err) {
                next(err);
            } else {
                if (collection) {
                    req.attached.collection = collection;
                }
                next();
            }
        });
    } else {
        next();
    }
};