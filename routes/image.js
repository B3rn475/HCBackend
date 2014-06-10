/*jslint node: true, nomen: true, es5: true */
"use strict";

var fs = require("fs"),
    Image = require("../models/image.js").model;


exports.index = function (req, res) {
    var count,
        max_id,
        since,
        error,
        query = {};
    
    if (req.query.count === undefined) {
        count = 100;
    } else {
        count = parseInt(req.query.count, 10);
        if (req.query.count !== count.toString()) {
            error = "Invalid 'count' parameter, it is not a number";
        } else {
            if (count < 1 || count > 100) {
                error = "Invalid 'count' parameter, out of bound";
            }
        }
    }
    
    if (!error && req.query.max_id !== undefined) {
        max_id = parseInt(req.query.max_id, 10);
        if (req.query.max_id !== max_id.toString()) {
            error = "Invalid 'max_id' parameter, it is not a number";
        } else {
            if (max_id < 0) {
                error = "Invalid 'max_id' parameter, out of bound";
            }
        }
    }
    
    if (!error && req.query.since !== undefined) {
        since = parseInt(req.query.since, 10);
        if (req.query.since !== since.toString()) {
            error = "Invalid 'since' parameter, it is not a number";
        } else {
            if (since < 0) {
                error = "Invalid 'since' parameter, out of bound";
            }
        }
    }
    
    if (!error && (since !== undefined || max_id !== undefined)) {
        query._id = {};
        if (since !== undefined) {
            query._id.$gt = since;
        }
        if (max_id !== undefined) {
            query._id.$lt = max_id;
        }
    }
    
    if (error) {
        res.format({
            text: function () {
                res.send(501, "not implemented");
            },
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send(400, { error: error});
            }
        });
    } else {
        Image.find(query,
                   {},
                   {sort: {_id: -1}, limit: count},
                   function (err, images) {
                res.format({
                    text: function () {
                        res.send(501, "not implemented");
                    },
                    html: function () {
                        res.send(501, "not implemented");
                    },
                    json: function () {
                        res.send(images);
                    }
                });
            });
    }
};

exports.add = function (req, res, next) {
    var obj = {},
        image,
        error;
    
    if (req.body.width === undefined) {
        error = "Missing 'width' field";
    } else {
        obj.width = parseInt(req.body.width, 10);
        if (obj.width.toString() !== req.body.width) {
            error = "Invalid 'width', it is not a number";
        } else {
            if (obj.width < 1) {
                error = "invalid 'width' field, out of bound";
            }
        }
    }
    
    if (!error && req.body.height === undefined) {
        error = "Missing 'height' field";
    } else {
        obj.height = parseInt(req.body.height, 10);
        if (obj.height.toString() !== req.body.height) {
            error = "Invalid 'height' field, it is not a number";
        } else {
            if (obj.height < 1) {
                error = "invalid 'height' field, out of bound";
            }
        }
    }
    
    if (!error && req.body.payload === undefined) {
        error = "Missing 'payload' parameter";
    } else {
        if (new RegExp("!^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$").test(req.body.payload)) {
            error = "Invalid 'payload' field, it is not a valid base64 string";
        }
    }
    
    if (error) {
        res.format({
            text: function () {
                res.send(501, "not implemented");
            },
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send(400, { error: error});
            }
        });
    } else {
        image = new Image(obj);
        image.save(function (err, image) {
            if (err) {
                next(err);
                return;
            }
            image.mediaLocator = '/storage/image/' + image.id.toString() + ".jpg";
            image.save(function (err, image) {
                if (err) {
                    next(err);
                    return;
                }
                fs.writeFile("./storage/image/" + image.id.toString() + ".jpg", new Buffer(req.body.payload, "base64"),
                             function (err) {
                        if (err) {
                            next(err);
                            image.delete();
                            return;
                        }
                        res.format({
                            text: function () {
                                res.send(501, "not implemented");
                            },
                            html: function () {
                                res.send(501, "not implemented");
                            },
                            json: function () {
                                res.send({ status: "OK", id: image.id});
                            }
                        });
                    });
            });
        });
    }
};