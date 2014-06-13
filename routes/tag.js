/*jslint node: true, nomen: true, es5: true */
"use strict";

var fs = require("fs"),
    Tag = require("../models/tag.js").model;

exports.routes = {};
exports.params = {};

exports.routes.index = function (req, res) {
    var min_id, //used later
        query = {};
    
    if (req.since_id !== undefined || req.max_id !== undefined) {
        query._id = {};
        if (req.since_id !== undefined) {
            query._id.$gt = req.since_id;
        }
        if (req.max_id !== undefined) {
            query._id.$lte = req.max_id;
        }
    }
    
    Tag.find(query,
               {},
               {sort: {_id: -1}, limit: req.count},
               function (err, tags) {
            res.format({
                text: function () {
                    res.send(501, "not implemented");
                },
                html: function () {
                    res.send(501, "not implemented");
                },
                json: function () {
                    var search_metadata = {
                        count: req.count,
                    };
                    if (req.max_id !== undefined) {
                        search_metadata.max_id = req.max_id;
                    }
                    if (req.since_id !== undefined) {
                        search_metadata.since_id = req.since_id;
                    }
                    if (tags.length > 0) {
                        search_metadata.refresh_url = "?since_id=" + tags[0].id + "&count=" + req.count;
                        if (tags.length === req.count) {
                            min_id = tags[tags.length - 1].id;
                            if (min_id > 0) {
                                search_metadata.next_results = "?max_id=" + min_id - 1;
                                if (req.since_id !== undefined) {
                                    search_metadata.next_results += "&since_id=" + req.since_id;
                                }
                                search_metadata.next_results += "&count=" + req.count;
                            }
                        }
                    }
                    res.send({
                        status: "OK",
                        tags: tags,
                        search_metadata: search_metadata
                    });
                }
            });
        });
};

exports.routes.add = function (req, res, next) {
    var obj = {},
        tag;
    tag = new Tag(obj);
    tag.save(function (err, tag) {
        if (err) {
            next(err);
            return;
        }
        tag.save(function (err, tag) {
            if (err) {
                next(err);
                return;
            }
            res.format({
                html: function () {
                    res.send(501, "not implemented");
                },
                json: function () {
                    res.send({ status: "OK", id: tag.id});
                }
            });
        });
    });
};

exports.routes.get = function (req, res) {
    res.format({
        text: function () {
            res.send(501, "not implemented");
        },
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            res.send({ status: "OK", image: req.image});
        }
    });
};

exports.params.id = function (req, res, next, inId) {
    var error,
        idStr = inId.toString(),
        id = parseInt(idStr.toString(), 10);
    if (idStr !== id.toString()) {
        error = "Invalid Tag 'id', it is not a number";
    } else {
        if (id < 0) {
            error = "Invalid Tag 'id', must be greater than 0";
        }
    }
    if (error) {
        res.format({
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send(400, { status: "KO", error: error});
            }
        });
    } else {
        Image.find({_id : id}, function (err, tag) {
            console.log(tag);
            if (err) {
                next(err);
            } else if (tag) {
                req.tag = tag;
                next();
            } else {
                err = "Unable to find Tag " + id;
                res.format({
                    html: function () {
                        res.send(501, "not implemented");
                    },
                    json: function () {
                        res.send(404, { status: "KO", error: err });
                    }
                });
            }
        });
    }
};