/*jslint node: true, nomen: true, es5: true */
"use strict";

var Tag = require("../models/tag.js").model,
    index = require("./index.js"),
    _ = require("underscore-node");

exports.routes = {};
exports.params = {};
exports.body = {};

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
    res.format({
        html: function () {
            index.algorithms.html.add(req, res, next, Tag);
        },
        json: function () {
            index.algorithms.json.add(req, res, next, Tag);
        }
    });
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
    });
};

exports.routes.removeAlias = function (req, res, next) {
    res.format({
        html: function () {
            res.send(501, "not implemented");
        },
        json: function () {
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
    });
};

exports.params.id = function (req, res, next, inId) {
    index.params.id(req, res, next, Tag, inId);
};

exports.params.language = function (req, res, next, inValue) {
    index.params.regexp(req, res, next, "language", new RegExp("[a-z]{2}-[A-Z]{2}$"), inValue);
};

exports.body.id = function (req, res, next) {
    index.body.id(req, res, next, Tag);
};

exports.body.language = function (req, res, next) {
    index.body.regexp(req, res, next, "language", new RegExp("[a-z]{2}-[A-Z]{2}$"));
};

exports.body.name = function (req, res, next) {
    index.body.regexp(req, res, next, "name", new RegExp("[a-zA-Z ]+$"));
};