/*jslint node: true, nomen: true, es5: true */
"use strict";

var fs = require("fs"),
    Image = require("../models/image.js").model,
    location = require("../models/image.js").regexp.location,
    Action = require("../models/action.js").model,
    Tag = require("../models/tag.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

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
            index.algorithms.json.list(req, res, next, Image);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {width: req.attached.width, height: req.attached.height},
        cb = function (image, next) {
            fs.writeFile("./storage/image/" + image.id.toString() + ".jpg", new Buffer(req.attached.payload, "base64"), next);
        };
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
            res.send(501, "not implemented");
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
    var match = { type: "tagging" },
        group = {$group: {_id: "$tag"}},
        grouping = {$group: {_id: null, result: {$addToSet: "$_id"}}},
        cbNext = function (err, objects) {
            var query = {};
            if (objects.length > 0) {
                query._id = { $in: objects[0].result};
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
    if (req.attached.image) { match.image = req.attached.image.id; }
    index.algorithms.aggregate(req, res, cbNext, Action, [{$match: match}, group], grouping);
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Image, inId);
};

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.id = function (req, res, next) {
    index.query.mandatory.id(req, res, index.query.register(req, res, next, Image.pname, "id"), Image);
};

exports.query.optional.id = function (req, res, next) {
    index.query.optional.id(req, res, index.query.register(req, res, next, Image.pname, "id"), Image);
};

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.body.mandatory.id = function (req, res, next) {
    index.body.mandatory.id(req, res, next, Image);
};

exports.body.optional.id = function (req, res, next) {
    index.body.optional.id(req, res, next, Image);
};

exports.body.mandatory.width = function (req, res, next) {
    index.body.mandatory.integer(req, res, next, "width", 1);
};

exports.body.optional.width = function (req, res, next) {
    index.body.optional.integer(req, res, next, "width", 1);
};

exports.body.mandatory.height = function (req, res, next) {
    index.body.mandatory.integer(req, res, next, "height", 1);
};

exports.body.optional.height = function (req, res, next) {
    index.body.optional.integer(req, res, next, "height", 1);
};

exports.body.mandatory.payload = function (req, res, next) {
    index.body.mandatory.base64(req, res, next, "payload");
};

exports.body.optional.payload = function (req, res, next) {
    index.body.optional.base64(req, res, next, "payload");
};

var checkInteger = function (int, min, max) {
    if (_.isUndefined(int)) { return false; }
    if (!_.isNumber(int)) { return false; }
    if (Math.floor(int) !== int) { return false; }
    if (min && int < min) { return false; }
    if (max && int > max) { return false; }
    return true;
};

var checkPose = function (image) {
    return function (item) {
        if (!checkInteger(item.x0, 0, image.width - 1)) { return false; }
        if (!checkInteger(item.y0, 0, image.height - 1)) { return false; }
        if (!checkInteger(item.x1, 0, image.width - 1)) { return false; }
        if (!checkInteger(item.y1, 0, image.height - 1)) { return false; }
        if (!location.test(item.location)) { return false; }
        return true;
    };
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

exports.body.mandatory.pose = function (req, res, next) {
    if (req.attached.image) {
        index.body.mandatory.array(req, res, next, "pose", checkPose(req.attached.image), mapPose);
    } else if (req.attached.width && req.attached.height) {
        index.body.mandatory.array(req, res, next, "pose", checkPose({width: req.attached.width, height: req.attached.height}), mapPose);
    } else {
        next();
    }
};

exports.body.optional.pose = function (req, res, next) {
    if (req.attached.image) {
        index.body.optional.array(req, res, next, "pose", checkPose(req.attached.image), mapPose);
    } else if (req.attached.width && req.attached.height) {
        index.body.optional.array(req, res, next, "pose", checkPose({width: req.attached.width, height: req.attached.height}), mapPose);
    } else {
        next();
    }
};