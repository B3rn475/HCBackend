/*jslint node: true, nomen: true, es5: true */
"use strict";

var _ = require("underscore-node");

/**
 * RegExps
 */

var alpha = /^[a-zA-Z]+$/,
    alphanumeric = /^[a-zA-Z0-9]+$/,
    numeric = /^-?[0-9]+$/,
    int = /^(?:-?(?:0|[1-9][0-9]*))$/,
    float = /^(?:-?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/,
    hexadecimal = /^[0-9a-fA-F]+$/,
    hexcolor = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    base64 = /!^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;

/**
 * Middlewares
 */

exports.middlewares = {};

exports.middlewares.init = function (req, res, next) {
    req.attached = {};
    req.errors = [];
    next();
};

/**
 * Routes
 */

exports.routes = {};

exports.routes.index = function (req, res) {
    res.format({
        html: function () {
            res.send("Server Up and Running");
        },
        json: function () {
            res.send({ status: "OK", message: "Server Up and Running" });
        }
    });
};

exports.routes.invalidRoute = function (req, res) {
    res.format({
        html: function () {
            res.send(404, "invalid route");
        },
        json: function () {
            res.send(404, { status: "KO", errors: { location: "url", message: "Invalid route"} });
        }
    });
};

/**
 * Algorithms
 */

exports.algorithms = {json: {}, html: {}};

exports.algorithms.json.get = function (req, res, next, Model, populate) {
    if (req.errors.length) {
        exports.algorithms.json.error(req, res);
    } else {
        var json = { status: "OK"},
            iMax,
            obj = req.attached[Model.pname];
        if (populate === undefined) {
            json[Model.pname] = obj;
            res.send(json);
        } else {
            if (_.isArray(populate)) {
                iMax = populate.length - 2;
                populate.forEach(function (p, i) {
                    if (i === populate.length) {
                        populate = p;
                        return;
                    }
                    obj = obj.populate(p);
                });
            }
            obj.populate(populate, function (err, obj) {
                if (err) {
                    next(err);
                } else {
                    json[Model.pname] = obj;
                    res.send(json);
                }
            });
        }
    }
};

exports.algorithms.html.get = function (req, res, next, Model) {
    res.send(501, "not implemented");
};

exports.algorithms.json.list = function (req, res, next, Model, conditions, fields, options) {
    if (req.errors.length) {
        exports.algorithms.json.error(req, res);
    } else {
        if (conditions === undefined) {
            conditions = {};
        }
        if (fields === undefined) {
            fields = {};
        }
        if (options === undefined) {
            options = {};
        }
        if (req.attached.since_id !== undefined || req.attached.max_id !== undefined) {
            conditions._id = {};
            if (req.attached.since_id !== undefined) {
                conditions._id.$gt = req.attached.since_id;
            }
            if (req.attached.max_id !== undefined) {
                conditions._id.$lte = req.attached.max_id;
            }
        }

        options.sort = {_id: -1};
        options.limit = req.attached.count;

        Model.find(conditions,
            fields,
            options,
            function (err, objects) {
                if (err) {
                    next(err);
                } else {
                    var min_id,
                        json = { status: "OK"},
                        search_metadata = {
                            count: req.attached.count,
                        };
                    if (req.max_id !== undefined) {
                        search_metadata.max_id = req.attached.max_id;
                    }
                    if (req.since_id !== undefined) {
                        search_metadata.since_id = req.attached.since_id;
                    }
                    if (objects.length > 0) {
                        search_metadata.refresh_url = "?since_id=" + objects[0].id + "&count=" + req.attached.count;
                        if (objects.length === req.attached.count) {
                            min_id = objects[objects.length - 1].id;
                            if (min_id > 0) {
                                search_metadata.next_results = "?max_id=" + (min_id - 1);
                                if (req.since_id !== undefined) {
                                    search_metadata.next_results += "&since_id=" + req.attached.since_id;
                                }
                                search_metadata.next_results += "&count=" + req.attached.count;
                            }
                        }
                    }
                    json[Model.json_list_property] = objects;
                    json.search_metadata = search_metadata;
                    res.send(json);
                }
            });
    }
};

exports.algorithms.json.add = function (req, res, next, Model, obj, savecb) {
    if (req.errors.length) {
        exports.algorithms.json.error(req, res);
    } else {
        if (obj === undefined) { obj = {}; }
        obj = new Model(obj);
        obj.save(function (err, obj) {
            if (err) {
                next(err);
                return;
            }
            var cbNext = function (err) {
                if (err) {
                    obj.delete();
                    next(err);
                } else {
                    res.send({ status: "OK", id: obj.id});
                }
            };
            if (savecb !== undefined) {
                savecb(obj, cbNext);
            } else {
                cbNext();
            }
        });
    }
};

exports.algorithms.json.error = function (req, res) {
    res.send({
        status: "KO",
        errors: req.errors
    });
};

exports.algorithms.html.list = function (req, res, next, Model, conditions, fields, options) {
    res.send(501, "not implemented");
};

exports.algorithms.html.add = function (req, res, next, Model, obj, savecb) {
    req.send(501, "not implemented");
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (req, res, next, Model, id) {
    var error;
    if (isNaN(id)) {
        id = id.toString();
        if (int.test(id)) {
            id = parseInt(id, 10);
        } else {
            id = undefined;
        }
    }
    if (id && Math.floor(id) !== id) {
        if (id < 0) {
            error = true;
            req.errors.push({location: "url", name: "id", message: "Invalid " + Model.modelName + " 'id', must be greater than 0"});
        }
    } else {
        error = true;
        req.errors.push({location: "url", name: "id", message: "Invalid '" + Model.modelName + " 'id', it is not a number"});
    }
    if (error) {
        next();
    } else {
        Model.findOne({_id : id}, function (err, obj) {
            if (err) {
                next(err);
            } else if (obj) {
                req.attached[Model.pname] = obj;
                next();
            } else {
                req.errors.push({location: "url", name: "id", message: "Unable to find " + Model.pname + " " + id});
                next();
            }
        });
    }
};

exports.params.regexp = function (req, res, next, property, exp, value) {
    var error = false;
    if (!exp.test(value)) {
        error = true;
        req.errors.add({location: "url", name: property, message: "Invalid '" + property + "'"});
    }
    if (!error) {
        req.attached[property] = value;
    }
    next();
};

/**
 * Query Parameters
 */

exports.query = {
    mandatory: {},
    optional: {},
    unchecked: {},
};

exports.query.mandatory.populate = function (req, res, next) {
    exports.query.mandatory.boolean(req, res, next, "populate");
};

exports.query.optional.populate = function (req, res, next) {
    exports.query.optional.boolean(req, res, next, "populate", false);
};

exports.query.mandatory.count = function (req, res, next) {
    exports.query.mandatory.integer(req, res, next, "count", 0);
};

exports.query.optional.count = function (req, res, next) {
    exports.query.optional.integer(req, res, next, "count", 0, undefined, 100);
};

exports.query.mandatory.max_id = function (req, res, next) {
    exports.query.mandatory.integer(req, res, next, "max_id", 0);
};

exports.query.optional.max_id = function (req, res, next) {
    exports.query.optional.integer(req, res, next, "max_id", 0);
};

exports.query.mandatory.since_id = function (req, res, next) {
    exports.query.mandatory.integer(req, res, next, "since_id", 0);
};

exports.query.optional.since_id = function (req, res, next) {
    exports.query.optional.integer(req, res, next, "since_id", 0);
};

exports.query.mandatory.boolean = function (req, res, next, property) {
    if (req.query[property] === undefined) {
        req.errors.push({location: "query", name: property, message: "Missing Query Parameter '" + property + "'" });
        next();
    } else {
        exports.query.unchecked.boolean(req, res, next, property);
    }
};

exports.query.optional.boolean = function (req, res, next, property, dvalue) {
    if (req.query[property] === undefined) {
        if (dvalue) {
            req.attached[property] = dvalue;
        }
        next();
    } else {
        exports.query.unchecked.boolean(req, res, next, property);
    }
};

exports.query.unchecked.boolean = function (req, res, next, property) {
    var value = req.query[property];
    req.attached[property] = (value === "false" || value === "0") ? false : true;
    next();
};

exports.query.mandatory.integer = function (req, res, next, property, min, max) {
    if (req.query[property] === undefined) {
        req.errors.push({location: "query", name: property, message: "Missing Query Parameter '" + property + "'" });
        next();
    } else {
        exports.query.unchecked.integer(req, res, next, property, min, max);
    }
};

exports.query.optional.integer = function (req, res, next, property, min, max, dvalue) {
    if (req.query[property] === undefined) {
        if (dvalue) {
            req.attached[property] = dvalue;
        }
        next();
    } else {
        exports.query.unchecked.integer(req, res, next, property, min, max);
    }
};

exports.query.unchecked.integer = function (req, res, next, property, min, max) {
    var error,
        value = req.query[property];
    if (isNaN(value)) {
        value = value.toString();
        if (int.test(value)) {
            value = parseInt(value, 10);
        } else {
            value = undefined;
        }
    }
    if (value && Math.floor(value) !== value) {
        if ((min && value < min) || (max && value > max)) {
            error = true;
            req.errors.push({location: "query", name: property, message: "Invalid '" + property + "' parameter, out of bound"});
        }
    } else {
        error = true;
        req.errors.push({location: "query", name: property, message: "Invalid '" + property + "' parameter, it is not a number"});
    }
    if (!error) {
        req.attached[property] = value;
    }
    next();
};

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    unchecked: {},
};

exports.body.mandatory.id = function (req, res, next, Model) {
    if (req.body[Model.pname] === undefined) {
        req.errors.push({location: "body", name: Model.pname, message: "Missing Body Parameter '" + Model.pname + "'" });
        next();
    } else {
        exports.body.unchecked.id(req, res, next, Model);
    }
};

exports.body.optional.id = function (req, res, next, Model) {
    if (req.body[Model.pname] === undefined) {
        next();
    } else {
        exports.body.unchecked.id(req, res, next, Model);
    }
};

exports.body.unchecked.id = function (req, res, next, Model) {
    exports.body.uncheked.integer(req, res, function () {
        Model.findOne({_id : req.attached[Model.pname]}, function (err, obj) {
            if (err) {
                next(err);
            } else if (obj) {
                req.attached[Model.pname] = obj;
                next();
            } else {
                req.errors.push({location: "body", name: Model.pname, message: "Unable to find " + Model.modelName
                                 + " " + req.attached[Model.pname]
                                 + " in Body Parameter '"
                                 + Model.pname + "'"});
                next();
            }
        });
    }, Model.pname, 0);
};

exports.body.mandatory.integer = function (req, res, next, property, min, max) {
    if (req.body[property] === undefined) {
        req.errors.push({location: "body", name: property, message: "Missing Body Parameter '" + property + "'" });
        next();
    } else {
        exports.body.unchecked.integer(req, res, next, property, min, max);
    }
};

exports.body.optional.integer = function (req, res, next, property, min, max, dvalue) {
    if (req.body[property] === undefined) {
        if (dvalue) {
            req.attached[property] = dvalue;
        }
        next();
    } else {
        exports.body.unchecked.integer(req, res, next, property, min, max);
    }
};

exports.body.unchecked.integer = function (req, res, next, property, min, max) {
    var error,
        value = req.body[property];
    if (isNaN(value)) {
        value = value.toString();
        if (int.test(value)) {
            value = parseInt(value, 10);
        } else {
            value = undefined;
        }
    }
    if (value && Math.floor(value) !== value) {
        if ((min && value < min) || (max && value > max)) {
            error = true;
            req.errors.push({location: "body", name: property, message: "invalid Body Parameter '" + property + "' field, out of bound"});
        }
    } else {
        error = true;
        req.errors.push({location: "body", name: property, message: "Invalid Body Parameter '" + property + "', it is not an integer"});
    }
    if (!error) {
        req.attached[property] = value;
    }
    next();
};

exports.body.mandatory.float = function (req, res, next, property, min, max) {
    if (req.body[property] === undefined) {
        req.errors.push({location: "body", name: property, message: "Missing Body Parameter '" + property + "'" });
        next();
    } else {
        exports.body.unchecked.float(req, res, next, property, min, max);
    }
};

exports.body.optional.float = function (req, res, next, property, min, max, dvalue) {
    if (req.body[property] === undefined) {
        if (dvalue) {
            req.attached[property] = dvalue;
        }
        next();
    } else {
        exports.body.unchecked.float(req, res, next, property, min, max);
    }
};

exports.body.unchecked.float = function (req, res, next, property, min, max) {
    var error,
        value = req.body[property];
    if (isNaN(value)) {
        value = value.toString();
        if (float.test(value)) {
            value = parseFloat(value, 10);
        } else {
            value = undefined;
        }
    }
    if (value) {
        if ((min && value < min) || (max && value > max)) {
            error = true;
            req.errors.push({location: "body", name: property, message: "invalid Body Parameter '" + property + "' field, out of bound"});
        }
    } else {
        error = true;
        req.errors.push({location: "body", name: property, message: "Invalid Body Parameter '" + property + "', it is not an float"});
    }
    if (!error) {
        req.attached[property] = value;
    }
    next();
};

exports.body.mandatory.base64 = function (req, res, next, property) {
    if (req.body[property] === undefined) {
        req.errors.push({location: "body", name: property, message: "Missing Body Parameter '" + property + "'" });
        next();
    } else {
        exports.body.unchecked.regexp(req, res, next, property, base64, "Base64 String");
    }
};

exports.body.optional.base64 = function (req, res, next, property, dvalue) {
    if (req.body[property] === undefined) {
        if (dvalue) {
            req.attached[property] = dvalue;
        }
        next();
    } else {
        exports.body.unchecked.regexp(req, res, next, property, base64, "Base64 String");
    }
};

exports.body.mandatory.regexp = function (req, res, next, property, exp, type) {
    if (req.body[property] === undefined) {
        req.errors.push({location: "body", name: property, message: "Missing Body Parameter '" + property + "'" });
        next();
    } else {
        exports.body.unchecked.regexp(req, res, next, property, exp, type);
    }
};

exports.body.optional.regexp = function (req, res, next, property, exp, type, dvalue) {
    if (req.body[property] === undefined) {
        if (dvalue) {
            req.attached[property] = dvalue;
        }
        next();
    } else {
        exports.body.unchecked.regexp(req, res, next, property, exp, type);
    }
};

exports.body.unchecked.regexp = function (req, res, next, property, exp, type) {
    var value = req.body[property];
    if (exp.test(value)) {
        req.attached[property] = value;
    } else {
        req.errors.push({location: "body", name: property, message: "Invalid Body Parameter '" + property + "'" + (type ? ", it is not a valid " + type : "")});
    }
    next();
};

exports.body.mandatory.array = function (req, res, next, property, check, map) {
    if (req.body[property] === undefined) {
        req.errors.push({location: "body", name: property, message: "Missing Body Parameter '" + property + "'" });
        next();
    } else {
        exports.body.unchecked.array(req, res, next, property, check, map);
    }
};

exports.body.optional.array = function (req, res, next, property, check, map, dvalue) {
    if (req.body[property] === undefined) {
        if (dvalue) {
            req.attached[property] = dvalue;
        }
        next();
    } else {
        exports.body.unchecked.array(req, res, next, property, check, map);
    }
};

exports.body.unchecked.array = function (req, res, next, property, check, map) {
    var error,
        value = req.boby[property];
    if (!_.isArray(value)) {
        try {
            value = JSON.parse(value.toString());
            if (!_.isArray(value)) {
                value = undefined;
            }
        } catch (ex) {
            value = undefined;
        }
    }
    if (value) {
        if (check) {
            if (!_.every(value, check)) {
                error = true;
                req.errors.push({location: "body", name: property, message: "Invalid Body Parameter '" + property + "', some Array items are not valid"});
            }
        }
    } else {
        error = true;
        req.errors.push({location: "body", name: property, message: "Invalid Body Parameter '" + property + "', it is not an Array"});
    }
    if (!error) {
        if (map) {
            req.attached[property] = _.map(value, map);
        } else {
            req.attached[property] = value;
        }
    }
    next();
};