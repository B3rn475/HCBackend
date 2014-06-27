/*jslint node: true, nomen: true, es5: true */
/**
 * Developed By Carlo Bernaschina (GitHub - B3rn475)
 * www.bernaschina.com
 *
 * Copyright (c) 2014 Politecnico di Milano  
 * www.polimi.it
 *
 * Distributed under the MIT Licence
 */
"use strict";

var index = require("./index.js"),
    Action = require("../models/action.js").model,
    async = require("async"),
    _ = require("underscore-node");

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
            var aggregate = [
                {$match: {type: "tagging", tag: {$exists: true}, validity: true}},
                {$group: {_id: {image: "$image", tag: "$tag"}}},
                {$group: {_id: null, count: {$sum: 1}}}
            ];
            if (req.attached.collection) {
                if (req.attached.collection.images.length !== 0) {
                    aggregate = _.union([{$match: {image: {$in: req.attached.collection.images}}}], aggregate);
                } else {
                    res.send({ status: "OK", results: []});
                    return;
                }
            }
            Action.aggregate(aggregate,
                function (err, result) {
                    if (err) {
                        next(err);
                    } else {
                        var inputs = [],
                            i,
                            aggregate = [
                                {$match: {type: "tagging", tag: {$exists: true}, validity: true}},
                                {$group: {_id: {image: "$image", tag: "$tag"}}},
                                {$project: {_id: false, image: "$_id.image", tag: "$_id.tag"}},
                                {$skip: Math.floor(result[0].count * Math.random())},
                                {$limit: 1}
                            ],
                            map = function (item, next) {
                                Action.aggregate(aggregate, function (err, results) {
                                    if (err) {
                                        next(err);
                                    } else {
                                        next(undefined, results[0]);
                                    }
                                });
                            };
                        for (i = 0; i < req.attached.limit; i = i + 1) {
                            inputs.push(i);
                        }
                        async.mapLimit(inputs, 10,
                            map,
                            function (err, results) {
                                if (err) {
                                    next(err);
                                } else {
                                    res.send({ status: "OK", results: results});
                                }
                            });
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
            var aggregate = [
                {$match: {$and: [
                    {validity: true},
                    {$or: [
                        {type: "tagging", tag: {$exists: true}},
                        {type: "segmentation", segmentation: {$exists: true}},
                        {type: "segmentation", completed_at: {$exists: false}}
                    ]}
                ]}},
                {$project: {image: true, tag: true, type: true}},
                {$group: {_id: {image: "$image", tag: "$tag"}, count: {$sum: {$cond: [{$eq: ["$type", "tagging"]}, 0, 1]}}}},
                {$sort: {count: 1}},
                {$project: {_id: false, image: "$_id.image", tag: "$_id.tag"}},
                {$limit: req.attached.limit},
            ];
            if (req.attached.collection) {
                if (req.attached.collection.images.length !== 0) {
                    aggregate = _.union([{$match: {image: {$in: req.attached.collection.images}}}], aggregate);
                } else {
                    res.send({ status: "OK", results: []});
                    return;
                }
            }
            Action.aggregate(aggregate,
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
                
/**
 * Query Parameters
 */

exports.query = {
    mandatory: {},
    optional: {},
};
                
exports.query.mandatory.limit = index.query.mandatory.integer("limit", 1, 100);

exports.query.optional.limit = index.query.optional.integer("limit", 1, 100, 1);