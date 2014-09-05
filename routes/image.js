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

var fs = require("fs"),
    Image = require("../models/image.js").model,
    ImageTags = require("../models/imagetags.js").model,
    location = require("../models/image.js").regexp.location,
    Action = require("../models/action.js").model,
    Tag = require("../models/tag.js").model,
    index = require("./index.js"),
    _ = require("underscore-node"),
    sizeof = require("image-size"),
    isJPG = require("is-jpg"),
    sharp = require("sharp");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Image);
        },
        json: function () {
            if (req.attached.min_segmentations !== undefined || req.attached.max_segmentations !== undefined) {
                var _id = {},
                    prematch = {$and: [
                        {validity: true},
                        {$or: [
                            {type: "upload"},
                            {type: "segmentation", segmentation: {$exists: true}},
                        ]},
                    ]},
                    count = {},
                    aggregate = [
                        {$match: prematch},
                        {$project: {image: true, type: true}},
                        {$group: {_id: "$image", count: {$sum: {$cond: [{$eq: ["$type", "upload"]}, 0, 1]}}}},
                        {$sort: {_id: -1}},
                        {$match: {count: count}}
                    ];
                if (req.attached.min_segmentations !== undefined) {
                    count.$gte = req.attached.min_segmentations;
                }
                if (req.attached.max_segmentations !== undefined) {
                    count.$lte = req.attached.max_segmentations;
                }
                if (req.attached.since_id !== undefined || req.attached.max_id !== undefined) {
                    if (req.attached.since_id !== undefined) {
                        _id.$gt = req.attached.since_id;
                    }
                    if (req.attached.max_id !== undefined) {
                        _id.$lte = req.attached.max_id;
                    }
                    prematch.$and.push({_id: _id});
                }
                if (req.attached.count !== undefined) {
                    aggregate.push(
                        {$limit: req.attached.count}
                    );
                }
                aggregate.push(
                    {$group: {_id: null, images: {$push: "$_id"}}}
                );
                
                Action.aggregate(aggregate, function (err, results) {
                    if (err) {
                        next(err);
                    } else {
                        var query;
                        if (results.length > 0) {
                            query = {_id: {$in: results[0].images}};
                        } else {
                            query = {_id: {$in: []}};
                        }
                        index.algorithms.json.list(req, res, next, Image, query);
                    }
                });
            } else {
                index.algorithms.json.list(req, res, next, Image);
            }
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj,
        data = req.attached.payload || req.attached.url,
        cb = function (image, next) {
            if (isJPG(data)) {
                fs.writeFile("./storage/image/" + image.id.toString() + ".jpg",
                    data,
                    next);
            } else {
                sharp(data).toFile("./storage/image/" + image.id.toString() + ".jpg",
                    next);
            }
        };
    if (data) {
        obj = sizeof(data);
    } else {
        obj = {};
    }
    if (req.attached.pose) { obj.pose = req.attached.pose; }
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Image, obj, cb);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Image, obj, cb);
        }
    });
};

exports.routes.update = function (req, res, next) {
    res.format({
        html: function () {
            res.status(501).send("not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var image = req.attached.image;
                image.pose = req.attached.pose;
                image.save(function (err, image) {
                    if (err) {
                        next(err);
                    } else {
                        res.send({status: "OK"});
                    }
                });
            }
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

exports.routes.count = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Image);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Image);
        }
    });
};

exports.routes.tag = function (req, res, next) {
    var cbNext = function (err, objects) {
            var query = {};
            if (objects.length > 0 && objects[0].tags_set !== undefined) {
                query._id = { $in: objects[0].tags_set};
            } else {
                query._id = { $in: []};
            }
            res.format({
                html: function () {
                    index.algorithms.html.list(req, res, next, Tag, query);
                },
                json: function () {
                    index.algorithms.json.list(req, res, next, Tag, query);
                }
            });
        };
    if (req.attached.image) {
        ImageTags.find({image: req.attached.image.id}, cbNext);
    } else {
        cbNext(undefined, []);
    }
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(Image);

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.id = index.query.register(Image.pname, index.query.mandatory.id(Image), "id");

exports.query.optional.id = index.query.register(Image.pname, index.query.optional.id(Image), "id");

exports.query.mandatory.min_segmentations = index.query.register("min_segmentations", index.query.mandatory.integer("min_segmentations", 0));

exports.query.optional.min_segmentations = index.query.register("min_segmentations", index.query.optional.integer("min_segmentations", 0));

exports.query.mandatory.max_segmentations = index.query.register("max_segmentations", index.query.mandatory.integer("max_segmentations", 0));

exports.query.optional.max_segmentations = index.query.register("max_segmentations", index.query.optional.integer("max_segmentations", 0));

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.body.mandatory.id = index.body.mandatory.id(Image);

exports.body.optional.id = index.body.optional.id(Image);

exports.body.mandatory.width = index.body.mandatory.integer("width", 1);

exports.body.optional.width = index.body.optional.integer("width", 1);

exports.body.mandatory.height = index.body.mandatory.integer("height", 1);

exports.body.optional.height = index.body.optional.integer("height", 1);

exports.body.mandatory.payload = index.body.mandatory.base64jpg("payload");

exports.body.optional.payload = index.body.optional.base64jpg("payload");

exports.body.mandatory.url = index.body.mandatory.urlFile("url");

exports.body.optional.url = index.body.optional.urlFile("url");

var checkInteger = function (int, min, max) {
    if (_.isUndefined(int)) { return false; }
    if (!_.isNumber(int)) { return false; }
    if (Math.floor(int) !== int) { return false; }
    if (min && int < min) { return false; }
    if (max && int > max) { return false; }
    return true;
};

var checkPose = function (item) {
        var image = this.req.attached.ckimage;
        if (!checkInteger(item.x0, 0, image.width - 1)) { return false; }
        if (!checkInteger(item.y0, 0, image.height - 1)) { return false; }
        if (!checkInteger(item.x1, 0, image.width - 1)) { return false; }
        if (!checkInteger(item.y1, 0, image.height - 1)) { return false; }
        if (!location.test(item.location)) { return false; }
        return true;
    };

var mapPose = function (item) {
    return {
        location: item.location,
        x0: item.x0,
        y0: item.y0,
        x1: item.x1,
        y1: item.y1,
    };
};

exports.body.mandatory.pose = (function () {
    var mArray = index.body.mandatory.array("pose", checkPose, mapPose);
    return function (req, res, next) {
        if (req.attached.image) {
            req.attached.ckimage = req.attached.image;
            mArray(req, res, next);
        } else if (req.attached.width && req.attached.height) {
            req.attached.ckimage = {width: req.attached.width, height: req.attached.height};
            mArray(req, res, next);
        } else {
            next();
        }
    };
}());

exports.body.optional.pose = (function () {
    var mArray = index.body.optional.array("pose", checkPose, mapPose);
    return function (req, res, next) {
        if (req.attached.image) {
            req.attached.ckimage = req.attached.image;
            mArray(req, res, next);
        } else if (req.attached.payload) {
            req.attached.ckimage = sizeof(req.attached.payload);
            mArray(req, res, next);
        } else {
            next();
        }
    };
}());

/**
 * Checkers
 */

exports.checkers = {
    route: {}
};

exports.checkers.route.add = (function () {
    var eRequired = {location: "query", name: "payload|url", message: "Missing Payload or Url. At least one is required for Image upload" };
    return function (req, res, next) {
        if (req.attached.payload === undefined && req.attached.url === undefined) {
            req.errors.push(eRequired);
        }
        next();
    };
}());