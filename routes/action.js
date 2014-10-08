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

var Action = require("../models/action.js").model,
    regexp = require("../models/action.js").regexp,
    Tag = require("../models/tag.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    var query = { },
        fields = "";
    if (req.attached.type) { query.type = req.attached.type; }
    if (req.attached.validity !== undefined) { query.validity = req.attached.validity; }
    if (req.attached.completed !== undefined) {
        query.$or = [
            {type: "tagging", tag : {$exists: req.attached.completed}},
            {type: "segmentation", segmentation : {$exists: req.attached.completed}},
        ];
    }
    if (req.attached.image) { query.image = req.attached.image.id; }
    if (req.attached.tag) { query.tag = req.attached.tag.id; }
    if (req.attached.session) { query.session = req.attached.session.id; }
    if (req.attached.user) { query.user = req.attached.user.id; }
    if (req.attached.populate === undefined || !req.attached.populate) { fields = "-segmentation.points -segmentation.history"; }
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Action, query, fields);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Action, query, fields);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {type : req.attached.type};
    if (req.attached.session) { obj.session = req.attached.session.id; }
    if (req.attached.image) { obj.image = req.attached.image.id; }
    if (req.attached.user) { obj.user = req.attached.user.id; }
    if (req.attached.created_at) { obj.created_at = req.attached.created_at; }
    if (req.attached.completed_at) { obj.completed_at = req.attached.completed_at; }
    if (req.attached.tag) { obj.tag = req.attached.tag.id; }
    if (req.attached.points !== undefined) {
        obj.segmentation = { points: req.attached.points, history: req.attached.history, quality: null };
    }
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Action, obj);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Action, obj);
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
                var action = req.attached.action;
                if (req.attached.validity !== undefined) { action.validity = req.attached.validity; }
                if (req.attached.quality !== undefined && action.segmentation !== undefined) {
                    action.segmentation.quality = req.attached.quality;
                    action.markModified("segmentation");
                }
                action.save(function (err, action) {
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
            
exports.routes.complete = function (req, res, next) {
    res.format({
        html: function () {
            res.status(501).send("not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var action = req.attached.action;
                if (req.attached.tag !== undefined) { action.tag = req.attached.tag.id; }
                if (req.attached.points !== undefined) {
                    action.segmentation = { points: req.attached.points, history: req.attached.history, quality: null };
                }
                action.completed_at = new Date();
                action.save(function (err, action) {
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
            index.algorithms.html.get(req, res, next, Action);
        },
        json: function () {
            var populate;
            if (req.attached.populate) {
                populate = ["image", "tag", "user"];
            }
            index.algorithms.json.get(req, res, next, Action, populate);
        }
    });
};

exports.routes.count = function (req, res, next) {
    var query = {};
    if (req.attached.type) { query.type = req.attached.type; }
    if (req.attached.validity !== undefined) { query.validity = req.attached.validity; }
    if (req.attached.completed !== undefined) {
        query.$or = [
            {type: "tagging", tag : {$exists: req.attached.completed}},
            {type: "segmentation", segmentation : {$exists: req.attached.completed}},
        ];
    }
    if (req.attached.image) { query.image = req.attached.image.id; }
    if (req.attached.tag) { query.tag = req.attached.tag.id; }
    if (req.attached.session) { query.session = req.attached.session.id; }
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Action, query);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Action, query);
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(Action);

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.type = index.query.register("type", index.query.mandatory.regexp("type", regexp.type, "Action Type"));

exports.query.optional.type = index.query.register("type", index.query.optional.regexp("type", regexp.type, "Action Type"));

exports.query.mandatory.validity = index.query.register("validity", index.query.mandatory.boolean("validity"));

exports.query.optional.validity = index.query.register("validity", index.query.optional.boolean("validity"));

exports.query.mandatory.completed = index.query.register("completed", index.query.mandatory.boolean("completed"));

exports.query.optional.completed = index.query.register("completed", index.query.optional.boolean("completed"));

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {
        add : {},
        complete : {},
        update : {}
    }
};

exports.body.mandatory.id = index.body.mandatory.id(Action);

exports.body.optional.id = index.body.optional.id(Action);

exports.body.mandatory.type = index.body.mandatory.regexp("type", regexp.type, "Action Type");

exports.body.optional.type = index.body.optional.regexp("type", regexp.type, "Action Type");

exports.body.mandatory.validity = index.body.mandatory.boolean("validity");

exports.body.optional.validity = index.body.optional.boolean("validity");

exports.body.route.update.validity = function (req, res, next) {
    if (req.attached.action) {
        if (req.attached.action.type === "tagging" || req.attached.action.segmentation === undefined) {
            exports.body.mandatory.validity(req, res, next);
        } else {
            exports.body.optional.validity(req, res, next);
        }
    } else {
        next();
    }
};

exports.body.route.update.quality = (function () {
    var oFloat = index.body.optional.float("quality");
    return function (req, res, next) {
        if (req.attached.action && req.attached.action.type === "segmentation" && req.attached.action.segmentation !== undefined) {
            oFloat(req, res, next);
        } else {
            next();
        }
    };
}());

exports.body.route.add.tag = (function () {
    var mId = index.body.mandatory.id(Tag),
        oId = index.body.optional.id(Tag);
    return function (req, res, next) {
        if (req.attached.type === "segmentation") {
            mId(req, res, next);
        } else {
            oId(req, res, next);
        }
    };
}());
            
exports.body.route.complete.tag = (function () {
    var oId = index.body.optional.id(Tag);
    return function (req, res, next) {
        if (req.attached.action !== undefined && req.attached.action.type === "tagging") {
            oId(req, res, next);
        } else {
            next();
        }
    };
}());

var checkInteger = function (int, min, max) {
    if (_.isUndefined(int)) { return false; }
    if (!_.isNumber(int)) { return false; }
    if (Math.floor(int) !== int) { return false; }
    if (min && int < min) { return false; }
    if (max && int > max) { return false; }
    return true;
};

var checkPoint = function (item) {
    if (!checkInteger(item.x, 0)) { return false; }
    if (!checkInteger(item.y, 0)) { return false; }
    return true;
};
            
var checkHistoryPoint = function (item) {
    if (!checkInteger(item.x)) { return false; }
    if (!checkInteger(item.y)) { return false; }
    return true;
};

var checkHistory = function (item) {
    if (item.points === undefined) { return false; }
    if (!_.isArray(item.points)) { return false; }
    if (!_.every(item.points, checkHistoryPoint)) { return false; }
    if (!checkInteger(item.size, 1)) { return false; }
    if (typeof item.color !== "string") { return false; }
    if (!regexp.color.test(item.color)) { return false; }
    if (!checkInteger(item.time, 0)) { return false; }
    return true;
};

var mapPoint = function (item) {
    var obj = {
        x: item.x,
        y: item.y,
    };
    if (item.end) {
        obj.end = true;
    }
    return obj;
};
            
var mapHistory = function (item) {
    return {
        time: item.time,
        size : item.size,
        color: item.color,
        points: _.map(item.points, mapPoint)
    };
};

exports.body.route.add.points = (function () {
    var oArray = index.body.optional.array("points", checkPoint, mapPoint);
    return function (req, res, next) {
        if (req.attached.type === "segmentation") {
            oArray(req, res, next);
        } else {
            next();
        }
    };
}());

exports.body.route.add.history = (function () {
    var oArray = index.body.optional.array("history", checkHistory, mapHistory);
    return function (req, res, next) {
        if (req.attached.type === "segmentation") {
            oArray(req, res, next);
        } else {
            next();
        }
    };
}());
            
exports.body.route.complete.points = (function () {
    var oArray = index.body.optional.array("points", checkPoint, mapPoint);
    return function (req, res, next) {
        if (req.attached.action !== undefined && req.attached.action.type === "segmentation") {
            oArray(req, res, next);
        } else {
            next();
        }
    };
}());
            
exports.body.route.complete.history = (function () {
    var oArray = index.body.optional.array("history", checkHistory, mapHistory);
    return function (req, res, next) {
        if (req.attached.action !== undefined && req.attached.action.type === "segmentation") {
            oArray(req, res, next);
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

exports.checkers.open = (function () {
    var eAlreadyCompleted = {location: "status", name: "action", message: "Action is already completed" };
    return function (req, res, next) {
        if (req.attached.action) {
            if (req.attached.action.completed_at !== undefined) {
                req.errors.push(eAlreadyCompleted);
            }
        }
        next();
    };
}());
            
exports.checkers.completed = (function () {
    var eOpen = {location: "status", name: "action", message: "Action is still open" };
    return function (req, res, next) {
        if (req.attached.action) {
            if (req.attached.action.completed_at === undefined) {
                req.errors.push(eOpen);
            }
        }
        next();
    };
}());
            
exports.checkers.route.update = (function () {
    var eRequired = {location: "body", name: "validity|quality", message: "Missing validity or quality Body paramaters. At least one is required" };
    return function (req, res, next) {
        if (req.attached.action) {
            if (req.attached.action.type === "segmentation" && req.attached.action.segmentation !== undefined) {
                if (req.attached.validity === undefined && req.attached.quality === undefined) {
                    req.errors.push(eRequired);
                }
            }
        }
        next();
    };
}());

exports.checkers.route.validity = (function () {
    var eRequired = {location: "query", name: "image|tag|session", message: "Missing Image or Tag or Session id. At least one is required as filter" };
    return function (req, res, next) {
        if (!(req.attached.image || req.attached.tag || req.attached.session)) {
            req.errors.push(eRequired);
        }
        next();
    };
}());
            
exports.checkers.route.add = (function () {
    var eParameters = {location: "body", name: "points|history", message: "The parameters history and points must be set or not at the same time" },
        eCompletion = {location: "body", name: "completed_at", message: "The parameters completed_at cannot be set if created_at is not present" };
    return function (req, res, next) {
        if ((req.attached.points === undefined) !== (req.attached.history === undefined)) {
            req.errors.push(eParameters);
        }
        if (req.attached.created_at === undefined && req.attached.completed_at !== undefined) {
            req.errors.push(eCompletion);
        }
        next();
    };
}());
            
exports.checkers.route.complete = (function () {
    var eParameters = {location: "query", name: "points|history", message: "The parameters history and points must be set or not at the same time" };
    return function (req, res, next) {
        if ((req.attached.points === undefined) !== (req.attached.history === undefined)) {
            req.errors.push(eParameters);
        }
        next();
    };
}());