/*jslint node: true, nomen: true, es5: true */
"use strict";

var index = require("./index.js"),
    Action = require("../models/action.js").model,
    async = require("async");

/**
 * Routes
 */

exports.routes = {};

exports.routes.list = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            res.send({ status: "OK", algorithms: ["random", "leastused"] });
        }
    });
};

exports.routes.random = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            var inputs = [],
                i;
            for (i = 0; i < req.attached.limit; i = i + 1) {
                inputs.push(i);
            }
            async.mapLimit(inputs, 10,
                function (item, next) {
                    Action.aggregate([
                        {$match: {type: "tagging", tag: {$exists: true}, validity: true}},
                        {$group: {_id: {image: "$image", tag: "$tag"}}},
                        {$group: {_id: null, count: {$sum: 1}}}
                    ], function (err, result) {
                        if (err) {
                            next(err);
                        } else {
                            Action.aggregate([
                                {$match: {type: "tagging", tag: {$exists: true}, validity: true}},
                                {$group: {_id: {image: "$image", tag: "$tag"}}},
                                {$project: {_id: false, image: "$_id.image", tag: "$_id.tag"}},
                                {$skip: Math.floor(result[0].count * Math.random())},
                                {$lismit: 1}
                            ], function (err, results) {
                                if (err) {
                                    next(err);
                                } else {
                                    next(undefined, results[0]);
                                }
                            });
                        }
                    });
                },
                function (err, results) {
                    if (err) {
                        next(err);
                    } else {
                        res.send({ status: "OK", results: results});
                    }
                });
        }
    });
};

exports.routes.leastused = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            Action.aggregate([
                {$match: {$and: [
                    {validity: true},
                    {$or: [
                        {type: "tagging", tag: {$exists: true}},
                        {type: "segmentation", segmentation: {$exists: true}}
                    ]}
                ]}},
                {$project: {image: true, tag: true, type: true}},
                {$group: {_id: {image: "$image", tag: "$tag"}, count: {$sum: {$cond: [{$eq: ["$type", "tagging"]}, 0, 1]}}}},
                {$sort: {count: 1}},
                {$project: {_id: false, image: "$_id.image", tag: "$_id.tag"}},
                {$limit: req.attached.limit},
            ], function (err, results) {
                if (err) {
                    next(err);
                } else {
                    res.send({ status: "OK", results: results});
                }
            });
        }
    });
};
                
/**
 * Query Parameters
 */

exports.query = {
    mandatory: {},
    optional: {},
};
                
exports.query.mandatory.limit = function (req, res, next) {
    index.query.mandatory.integer(req, res, next, "limit", 1, 100);
};

exports.query.optional.limit = function (req, res, next) {
    index.query.optional.integer(req, res, next, "limit", 1, 100, 1);
};