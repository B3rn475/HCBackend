/*jslint node: true, nomen: true, es5: true */
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

exports.params.language = function (req, res, next, inValue) {
    index.params.regexp(req, res, next, "language", language, inValue);
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
    index.query.mandatory.id(req, res, index.query.register(req, res, next, Tag.pname, "id"), Tag);
};

exports.query.optional.id = function (req, res, next) {
    index.query.optional.id(req, res, index.query.register(req, res, next, Tag.pname, "id"), Tag);
};

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

exports.body.mandatory.id = function (req, res, next) {
    index.body.mandatory.id(req, res, next, Tag);
};

exports.body.optional.id = function (req, res, next) {
    index.body.optional.id(req, res, next, Tag);
};

exports.body.mandatory.language = function (req, res, next) {
    index.body.mandatory.regexp(req, res, next, "language", language, "Language Code");
};

exports.body.optional.language = function (req, res, next) {
    index.body.optional.regexp(req, res, next, "language", language, "Language Code");
};

exports.body.mandatory.name = function (req, res, next) {
    index.body.mandatory.regexp(req, res, next, "name", name, "Alias Name");
};

exports.body.optional.name = function (req, res, next) {
    index.body.optional.regexp(req, res, next, "name", name, "Alias Name");
};

exports.body.route.add.name = function (req, res, next) {
    index.body.mandatory.regexp(req, res, next, "name", name, "Tag Name");
};

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