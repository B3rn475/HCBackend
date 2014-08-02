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
            var statistics = {
                    actions: {
                        segmentations_per_image: {}
                    }
                },
                oneHourAgo = new Date(new Date().setHours(new Date().getHours() - 1)),
                aggregate = [
                    {$match: {$and: [
                        {validity: true},
                        {$or: [
                            {type: "upload"},
                            {type: "segmentation", segmentation: {$exists: true}},
                        ]}
                    ]}},
                    {$project: {image: true, tag: true, type: true}},
                    {$group: {_id: "$image", count: {$sum: {$cond: [{$eq: ["$type", "upload"]}, 0, 1]}}}},
                    {$group: {_id: 0, min: {$min: "$count"}, max: {$max: "$count"}}}
                ];
            Action.aggregate(aggregate, function (err, results) {
                if (err) {
                    next(err);
                } else {
                    if (results.length > 0) {
                        statistics.actions.segmentations_per_image.min = results[0].min;
                        statistics.actions.segmentations_per_image.max = results[0].max;
                    } else {
                        statistics.actions.segmentations_per_image.min = 0;
                        statistics.actions.segmentations_per_image.max = 0;
                    }
                    res.send({ status: "OK", statistics: statistics });
                }
            });
        }
    });
};