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
    Image = require("../models/image.js").model,
    async = require("async"),
    _ = require("underscore-node");

/**
 * Routes
 */

exports.routes = { image: {}, imageandtag: {}};

exports.routes.list = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            res.send({ status: "OK", objects: ["image", "imageandtag"] });
        }
    });
};

exports.routes.image.list = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            res.send({ status: "OK", algorithms: ["random", "leastused"] });
        }
    });
};

exports.routes.image.random = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            var aggregate = [
                {$group: {_id: null, count: {$sum: 1}}}
            ];
            if (req.attached.collection) {
                if (req.attached.collection.images.length !== 0) {
                    aggregate = _.union([{$match: {_id: {$in: req.attached.collection.images}}}], aggregate);
                } else {
                    res.send({ status: "OK", results: []});
                    return;
                }
            }
            Image.aggregate(aggregate,
                function (err, result) {
                    if (err) {
                        next(err);
                    } else {
                        var inputs = [],
                            i,
                            map = function (item, next) {
                                var aggregate = [
                                    {$skip: Math.floor(result[0].count * Math.random())},
                                    {$limit: 1},
                                    {$project: {_id: true}}
                                ];
                                Image.aggregate(aggregate, function (err, results) {
                                    if (err) {
                                        next(err);
                                    } else {
                                        next(undefined, results[0]._id);
                                    }
                                });
                            };
                        for (i = 0; i < req.attached.limit; i = i + 1) {
                            inputs.push(i);
                        }
                        async.map(inputs,
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

exports.routes.image.leastused = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            var oneHourAgo = new Date(new Date().setHours(new Date().getHours() - 1)),
                aggregate = [
                    {$match: {$and: [
                        {validity: true},
                        {$or: [
                            {type: "uploading"},
                            {type: "tagging", tag: {$exists: true}},
                        ]}
                    ]}},
                    {$project: {_id: false, image: true, type: true}},
                    {$group: {_id: "$image", count: {$sum: {$cond: [{$eq: ["$type", "tagging"]}, 0, 1]}}}},
                    {$sort: {count: 1}},
                    {$limit: req.attached.limit},
                    {$group: {_id: null, images: {$push: "$_id"}}}
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
                        var images;
                        if (results.length > 0) {
                            images = results[0].images;
                        } else {
                            images = [];
                        }
                        res.send({ status: "OK", results: images});
                    }
                });
        }
    });
};

exports.routes.imageandtag.list = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            res.send({ status: "OK", algorithms: ["random", "leastused"] });
        }
    });
};

exports.routes.imageandtag.random = function (req, res, next) {
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
                            map = function (item, next) {
                                var aggregate = [
                                    {$match: {type: "tagging", tag: {$exists: true}, validity: true}},
                                    {$group: {_id: {image: "$image", tag: "$tag"}}},
                                    {$skip: Math.floor(result[0].count * Math.random())},
                                    {$limit: 1},
                                    {$project: {_id: false, image: "$_id.image", tag: "$_id.tag"}}
                                ];
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
                        async.map(inputs, map,
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

exports.routes.imageandtag.leastused = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not Implemented");
        },
        json: function () {
            var oneHourAgo = new Date(new Date().setHours(new Date().getHours() - 1)),
                aggregate = [
                    {$match: {$and: [
                        {validity: true},
                        {$or: [
                            {type: "tagging", tag: {$exists: true}},
                            {type: "segmentation", segmentation: {$exists: true}},
                            {$and: [
                                {type: "segmentation", completed_at: {$exists: false}},
                                {type: "segmentation", created_at: {$lt: oneHourAgo}}
                            ]}
                        ]}
                    ]}},
                    {$project: {_id: false, image: true, tag: true, type: true}},
                    {$group: {_id: {image: "$image", tag: "$tag"}, count: {$sum: {$cond: [{$eq: ["$type", "tagging"]}, 0, 1]}}}},
                    {$group: {_id: "$_id.image", tags : {$push : {image: "$_id.image", tag: "$_id.tag", count: "$count"}}, maxCount: {$max: "$count"}}},
                    {$project: {_id: false, tags: true, maxCount: true}},
                    {$unwind: "$tags"},
                    {$project: {image: "$tags.image", tag: "$tags.tag", count: "$tags.count", equals: {$eq: ["$tags.count", "$maxCount"]}}},
                    {$match: {equals : true}},
                    {$project: {image: true, tag: true, count: true}},
                    {$group: {_id: "$image", tag: {$first: "$tag"}, count: {$first: "$count"}}},
                    {$sort: {count: 1}},
                    {$project: {_id: false, image: "$_id", tag: true}},
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