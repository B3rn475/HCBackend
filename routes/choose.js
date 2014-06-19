/*jslint node: true, nomen: true, es5: true */
"use strict";

var index = require("./index.js"),
    Action = require("../models/action.js").model;

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
                        {$skip: Math.floor(result[0].count * Math.random())},
                        {$limit: 1}
                    ], function (err, result) {
                        if (err) {
                            next(err);
                        } else {
                            res.send({ status: "OK", image: result[0]._id.image, tag: result[0]._id.tag});
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
                {$limit: 1},
            ], function (err, result) {
                if (err) {
                    next(err);
                } else {
                    res.send({ status: "OK", image: result[0]._id.image, tag: result[0]._id.tag});
                }
            });
        }
    });
};