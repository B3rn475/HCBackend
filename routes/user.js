/*jslint node: true, nomen: true, es5: true */
"use strict";

var fs = require("fs"),
    User = require("../models/user.js").model;

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
    
    User.find(query,
               {},
               {sort: {_id: -1}, limit: req.count},
               function (err, users) {
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
                    if (users.length > 0) {
                        search_metadata.refresh_url = "?since_id=" + users[0].id + "&count=" + req.count;
                        if (users.length === req.count) {
                            min_id = users[users.length - 1].id;
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
                        users: users,
                        search_metadata: search_metadata
                    });
                }
            });
        });
};

exports.routes.add = function (req, res, next) {
    var obj = {},
        user,
        error;
    
    if (req.body.app_id === undefined) {
        error = "Missing 'app_id' field";
    } else {
        obj.app_id = parseInt(req.body.app_id, 10);
        if (obj.app_id.toString() !== req.body.app_id) {
            error = "Invalid 'app_id', it is not a number";
        } else {
            if (obj.app_id < 1) {
                error = "invalid 'app_id' field, out of bound";
            }
        }
    }
    
    if (!error && req.body.app_user_id === undefined) {
        error = "Missing 'app_user_id' field";
    } else {
        obj.app_user_id = parseInt(req.body.app_user_id, 10);
        if (obj.app_user_id.toString() !== req.body.app_user_id) {
            error = "Invalid 'app_user_id' field, it is not a number";
        } else {
            if (obj.app_user_id < 1) {
                error = "invalid 'app_user_id' field, out of bound";
            }
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
        user = new User(obj);
        user.save(function (err, user) {
            if (err) {
                next(err);
                return;
            }
            user.save(function (err, user) {
                if (err) {
                    next(err);
                    return;
                }
                res.format({
                    html: function () {
                        res.send(501, "not implemented");
                    },
                    json: function () {
                        res.send({ status: "OK", id: user.id});
                    }
                });
            });
        });
    }
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
        error = "Invalid User 'id', it is not a number";
    } else {
        if (id < 0) {
            error = "Invalid User 'id', must be greater than 0";
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
        Image.find({_id : id}, function (err, user) {
            console.log(user);
            if (err) {
                next(err);
            } else if (user) {
                req.user = user;
                next();
            } else {
                err = "Unable to find User " + id;
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