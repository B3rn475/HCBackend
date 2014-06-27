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

var Tag = require("../models/tag.js").model,
    language = require("../models/tag.js").regexp.language,
    name = require("../models/tag.js").regexp.name,
    index = require("./index.js"),
    _ = require("underscore-node");

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.list(req, res, next, Tag);
        },
        json: function () {
            index.algorithms.json.list(req, res, next, Tag);
        }
    });
};

exports.routes.add = function (req, res, next) {
    var obj = {name: req.attached.name};
    if (req.attached.tag === undefined) {
        res.format({
            html: function () {
                index.algorithms.html.add(req, res, next, Tag, obj);
            },
            json: function () {
                index.algorithms.json.add(req, res, next, Tag, obj);
            }
        });
    } else {
        res.format({
            html: function () {
                res.send(501, "not implemented");
            },
            json: function () {
                res.send({ status: "OK", id: req.attached.tag.id});
            }
        });
    }
};

exports.routes.get = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.get(req, res, next, Tag);
        },
        json: function () {
            index.algorithms.json.get(req, res, next, Tag);
        }
    });
};

exports.routes.count = function (req, res, next) {
    res.format({
        html: function () {
            index.algorithms.html.count(req, res, next, Tag);
        },
        json: function () {
            index.algorithms.json.count(req, res, next, Tag);
        }
    });
};

var getAlias = function (aliases, language) {
    var ret;
    aliases.forEach(function (alias) {
        if (alias.language === language) {
            ret = alias;
        }
    });
    return ret;
};

exports.routes.addAlias = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var tag = req.attached.tag,
                    language = req.attached.language,
                    name = req.attached.name,
                    alias = getAlias(tag.aliases, language);
                if (alias === undefined) {
                    tag.aliases.push({language: language, name: name});
                    tag.save(function (err, tag) {
                        if (err) {
                            next(err);
                        } else {
                            res.send({ status: "OK" });
                        }
                    });
                } else {
                    if (alias.name === name) {
                        res.send({ status: "OK" });
                    } else {
                        res.send(400, { status: "KO", error: "Alias for language " + language + " is already " + alias.name});
                    }
                }
            }
        }
    });
};

exports.routes.removeAlias = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
            if (req.errors.length) {
                index.algorithms.json.error(req, res);
            } else {
                var tag = req.attached.tag,
                    language = req.attached.language,
                    alias = getAlias(tag.aliases, language);
                if (alias !== undefined) {
                    tag.aliases = _.without(tag.aliases, alias);
                    tag.save(function (err, tag) {
                        if (err) {
                            next(err);
                        } else {
                            res.send({ status: "OK" });
                        }
                    });
                } else {
                    res.send({ status: "OK" });
                }
            }
        }
    });
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = index.params.id(Tag);

exports.params.language = index.params.regexp("language", language);

/**
 * Query Params
 */

exports.query = {
    mandatory: {},
    optional: {},
    route: {}
};

exports.query.mandatory.id = index.query.register(Tag.pname, index.query.mandatory.id(Tag), "id");

exports.query.optional.id = index.query.register(Tag.pname, index.query.optional.id(Tag), "id");

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    route: {
        add: {}
    }
};

exports.body.mandatory.id = index.body.mandatory.id(Tag);

exports.body.optional.id = index.body.optional.id(Tag);

exports.body.mandatory.language = index.body.mandatory.regexp("language", language, "Language Code");

exports.body.optional.language = index.body.optional.regexp("language", language, "Language Code");

exports.body.mandatory.name = index.body.mandatory.regexp("name", name, "Alias Name");

exports.body.optional.name = index.body.optional.regexp("name", name, "Alias Name");

exports.body.route.add.name = index.body.mandatory.regexp("name", name, "Tag Name");

exports.body.route.add.exist = function (req, res, next) {
    if (req.attached.name) {
        Tag.findOne({name: req.attached.name }, function (err, tag) {
            if (err) {
                next(err);
            } else {
                if (tag) {
                    req.attached.tag = tag;
                }
                next();
            }
        });
    } else {
        next();
    }
};