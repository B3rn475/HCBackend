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
    base64 = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{4})$/;

/**
 * Middlewares
 */

exports.middlewares = {};

exports.middlewares.init = function (req, res, next) {
    req.attached = {};
    req.errors = [];
    req.search_metadata = {};
    next();
};


/**
 * Error Handler
 */

exports.errorHandler = function (options) {
    if (options === undefined || (options.dumpExceptions === false && options.showStack === false)) {
        return function (err, req, res, next) {
            res.format({
                html: function () {
                    res.send(500, "Internal Server Error");
                },
                json: function () {
                    res.send(500, { status: "KO", errors: [{ location: "internal", message: "Internal Server Error" } ] });
                }
            });
        };
    } else {
        return function (err, req, res, next) {
            res.format({
                html: function () {
                    res.send(500, "Internal Server Error");
                },
                json: function () {
                    var error = { location: "internal" };
                    if (options.dumpExceptions) {
                        error.message = err.message;
                    } else {
                        error.message = "Internal Server Error";
                    }
                    if (options.showStack) {
                        error.stack = err.stack;
                    }
                    res.send(500, { status: "KO", errors: [error] });
                }
            });
        };
    }
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

exports.algorithms.aggregate = function (req, res, next, Model, pipeline, grouping) {
    var match = {};
    if (req.attached.since_id !== undefined || req.attached.max_id !== undefined) {
        match._id = {};
        if (req.attached.since_id !== undefined) {
            match._id.$gt = req.attached.since_id;
        }
        if (req.attached.max_id !== undefined) {
            match._id.$lte = req.attached.max_id;
        }
    }
    pipeline.push({$match : match});
    pipeline.push({$sort : {_id: -1}});
    pipeline.push({$limit : req.attached.count });
    if (grouping !== undefined) {
        pipeline.push(grouping);
    }
    Model.aggregate(pipeline,
        function (err, objects) {
            if (err) {
                next(err);
            } else {
                next(undefined, objects);
            }
        });
};

exports.algorithms.filter = function (req, res, next, Model, query, fields, options) {
    if (query === undefined) {
        query = {};
    }
    if (fields === undefined) {
        fields = {};
    }
    if (options === undefined) {
        options = {};
    }
    if (req.attached.since_id !== undefined || req.attached.max_id !== undefined) {
        if (query._id === undefined) { query._id = { }; }
        if (req.attached.since_id !== undefined) {
            query._id.$gt = req.attached.since_id;
        }
        if (req.attached.max_id !== undefined) {
            query._id.$lte = req.attached.max_id;
        }
    }

    options.sort = {_id: -1};
    options.limit = req.attached.count;
    
    Model.find(query,
        fields,
        options,
        function (err, objects) {
            if (err) {
                next(err);
            } else {
                next(undefined, objects);
            }
        });
};

exports.algorithms.json.list = function (req, res, next, Model, query, fields, options, cbPrepare) {
    if (req.errors.length) {
        exports.algorithms.json.error(req, res);
    } else {
        var cbNext = function (err, objects) {
            if (err) {
                next(err);
            } else {
                var min_id,
                    json = { status: "OK"},
                    key,
                    url_tail,
                    search_metadata = req.search_metadata;
                if (req.attached.max_id !== undefined) {
                    search_metadata.max_id = req.attached.max_id;
                }
                if (req.attached.since_id !== undefined) {
                    search_metadata.since_id = req.attached.since_id;
                }
                if (objects.length > 0) {
                    url_tail = _.reduce(_.pairs(req.search_metadata), function (memo, n) {
                        return memo + "&" + encodeURIComponent(n[0]) + "=" + encodeURIComponent(n[1]);
                    }, "");
                    search_metadata.refresh_url = "?since_id=" + objects[0].id + url_tail;
                    if (objects.length === req.attached.count) {
                        min_id = objects[objects.length - 1].id;
                        if (min_id > 0) {
                            search_metadata.next_results = "?max_id=" + (min_id - 1);
                            if (req.attached.since_id !== undefined) {
                                search_metadata.next_results += "&since_id=" + req.attached.since_id;
                            }
                            search_metadata.next_results += url_tail;
                        }
                    }
                }
                json.search_metadata = search_metadata;
                if (cbPrepare === undefined) {
                    json[Model.json_list_property] = objects;
                    res.send(json);
                } else {
                    cbPrepare(objects, function (err, objects) {
                        if (err) {
                            next(err);
                        } else {
                            json[Model.json_list_property] = objects;
                            res.send(json);
                        }
                    });
                }
            }
        };
        exports.algorithms.filter(req, res, cbNext, Model, query, fields, options);
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

exports.algorithms.json.update = function (req, res, next, Model, query, update, options, updatecb) {
    if (req.errors.length) {
        exports.algorithms.json.error(req, res);
    } else {
        if (query === undefined) { query = {}; }
        if (update === undefined) { update = {}; }
        if (options === undefined) { options = {}; }
        Model.update(query, update, options, function (err, numAffected) {
            if (err) {
                next(err);
                return;
            }
            var cbNext = function (err) {
                if (err) {
                    next(err);
                } else {
                    res.send({ status: "OK", updated: numAffected});
                }
            };
            if (updatecb !== undefined) {
                updatecb(numAffected, cbNext);
            } else {
                cbNext();
            }
        });
    }
};

exports.algorithms.json.count = function (req, res, next, Model, query) {
    if (req.errors.length) {
        exports.algorithms.json.error(req, res);
    } else {
        if (query === undefined) { query = {}; }
        Model.count(query, function (err, count) {
            if (err) {
                next(err);
            } else {
                res.send({ status: "OK", count: count});
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
    res.send(501, "not implemented");
};

exports.algorithms.html.update = function (req, res, next, Model, query, update, options, updatecb) {
    res.send(501, "not implemented");
};

exports.algorithms.html.count = function (req, res, next, Model, query) {
    res.send(501, "not implemented");
};

/**
 * Url Params
 */

exports.params = {};

exports.params.id = function (Model) {
    var eInvalid = {location: "url", name: "id", message: "Invalid " + Model.modelName + " 'id', must be greater than 0"},
        eNotANumber = {location: "url", name: "id", message: "Invalid " + Model.modelName + " 'id', it is not a number"};
    return function (req, res, next, id) {
        var error;
        if (typeof id !== 'number') {
            id = id.toString();
            if (int.test(id)) {
                id = parseInt(id, 10);
            } else {
                id = undefined;
            }
        }
        if (id !== undefined && Math.floor(id) === id) {
            if (id < 0) {
                error = true;
                req.errors.push(eInvalid);
            }
        } else {
            error = true;
            req.errors.push(eNotANumber);
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
};

exports.params.regexp = function (property, regexp) {
    var eInvalid = {location: "url", name: property, message: "Invalid '" + property + "'"};
    return function (req, res, next, value) {
        var error = false;
        if (!regexp.test(value)) {
            error = true;
            req.errors.add(eInvalid);
        }
        if (!error) {
            req.attached[property] = value;
        }
        next();
    };
};

/**
 * Query Parameters
 */

exports.query = {
    mandatory: {},
    optional: {},
    unchecked: {},
};

exports.query.register = function (property, middleware, path) {
    var set;
    if (path === undefined) {
        set = function (req) {
            req.search_metadata[property] = req.attached[property];
        };
    } else {
        set = function (req) {
            var value = req.attached[property];
            if (value !== undefined) {
                req.search_metadata[property] = value[path];
            }
        };
    }
    return function (req, res, next) {
        middleware(req, res, function (err) {
            if (err) {
                next(err);
            } else {
                set(req);
                next();
            }
        });
    };
};

exports.query.unchecked.boolean = function (property) {
    return function (req, res, next) {
        var value = req.query[property];
        req.attached[property] = (value === false || value === "false" || value === "0") ? false : true;
        next();
    };
};

exports.query.mandatory.boolean = function (property) {
    var eMissing = {location: "query", name: property, message: "Missing Query Parameter '" + property + "'" },
        uBoolean = exports.query.unchecked.boolean(property);
    return function (req, res, next) {
        if (req.query[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uBoolean(req, res, next);
        }
    };
};

exports.query.optional.boolean = function (property, dvalue) {
    var uBoolean = exports.query.unchecked.boolean(property);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.query[property] === undefined) {
                next();
            } else {
                uBoolean(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.query[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uBoolean(req, res, next);
            }
        };
    }
};

var partialToInt = function (value) {
    if (typeof value !== 'number') {
        value = value.toString();
        if (int.test(value)) {
            value = parseInt(value, 10);
        } else {
            value = undefined;
        }
    }
    return value;
};

var partialToFloat = function (value) {
    if (typeof value !== 'number') {
        value = value.toString();
        if (float.test(value)) {
            value = parseFloat(value);
        } else {
            value = undefined;
        }
    }
    return value;
};

var partialToArray = function (value) {
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
    return value;
};

exports.query.unchecked.integer = function (property, min, max) {
    var eOutOfBound = {location: "query", name: property, message: "Invalid '" + property + "' parameter, out of bound"},
        eNotNumber = {location: "query", name: property, message: "Invalid '" + property + "' parameter, it is not a number"},
        checkValue;
    if (min === undefined) {
        if (max === undefined) {
            checkValue = function (value, req) {
                if (value === undefined || Math.floor(value) !== value) {
                    req.errors.push(eNotNumber);
                    return false;
                }
                return true;
            };
        } else {
            checkValue = function (value, req) {
                if (value !== undefined && Math.floor(value) === value) {
                    if (value > max) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotNumber);
                    return false;
                }
                return true;
            };
        }
    } else {
        if (max === undefined) {
            checkValue = function (value, req) {
                if (value !== undefined && Math.floor(value) === value) {
                    if (value < min) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotNumber);
                    return false;
                }
                return true;
            };
        } else {
            checkValue = function (value, req) {
                if (value !== undefined && Math.floor(value) === value) {
                    if (value < min || value > max) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotNumber);
                    return false;
                }
                return true;
            };
        }
    }
    return function (req, res, next) {
        var value = partialToInt(req.query[property]);
        if (checkValue(value, req)) {
            req.attached[property] = value;
        }
        next();
    };
};

exports.query.mandatory.integer = function (property, min, max) {
    var eMissing = {location: "query", name: property, message: "Missing Query Parameter '" + property + "'" },
        uInteger = exports.query.unchecked.integer(property, min, max);
    return function (req, res, next) {
        if (req.query[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uInteger(req, res, next);
        }
    };
};

exports.query.optional.integer = function (property, min, max, dvalue) {
    var uInteger = exports.query.unchecked.integer(property, min, max);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.query[property] === undefined) {
                next();
            } else {
                uInteger(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.query[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uInteger(req, res, next);
            }
        };
    }
};

exports.query.mandatory.populate = exports.query.register("populate", exports.query.mandatory.boolean("populate"));

exports.query.optional.populate = exports.query.register("populate", exports.query.optional.boolean("populate", false));

exports.query.mandatory.count = exports.query.register("count", exports.query.mandatory.integer("count", 0, 100));

exports.query.optional.count = exports.query.register("count", exports.query.optional.integer("count", 0, 100, 100));

exports.query.mandatory.max_id = exports.query.mandatory.integer("max_id", 0);

exports.query.optional.max_id = exports.query.optional.integer("max_id", 0);

exports.query.mandatory.since_id = exports.query.mandatory.integer("since_id", 0);

exports.query.optional.since_id = exports.query.optional.integer("since_id", 0);

exports.query.unchecked.id = function (Model) {
    var property = Model.pname,
        modelName = Model.modelName,
        uInteger = exports.query.unchecked.integer(property, 0),
        getId = function (req, res, next) {
            if (req.attached[property] === undefined) {
                next();
            } else {
                Model.findOne({_id : req.attached[property]}, function (err, obj) {
                    if (err) {
                        next(err);
                    } else if (obj) {
                        req.attached[property] = obj;
                        next();
                    } else {
                        req.errors.push({location: "query", name: property, message: "Unable to find " + modelName
                                         + " " + req.attached[property]
                                         + " in Query Parameter '"
                                         + property + "'"});
                        next();
                    }
                });
            }
        };
    return function (req, res, next) {
        uInteger(req, res, function (err) {
            if (err) {
                next(err);
            } else {
                getId(req, res, next);
            }
        });
    };
};

exports.query.mandatory.id = function (Model) {
    var eMissing = {location: "query", name: Model.pname, message: "Missing Query Parameter '" + Model.pname + "'" },
        uId = exports.query.unchecked.id(Model);
    return function (req, res, next) {
        if (req.query[Model.pname] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uId(req, res, next);
        }
    };
};

exports.query.optional.id = function (Model) {
    var uId = exports.query.unchecked.id(Model);
    return function (req, res, next) {
        if (req.query[Model.pname] === undefined) {
            next();
        } else {
            uId(req, res, next);
        }
    };
};

exports.query.unchecked.regexp = function (property, regexp, type) {
    var eNotPassed = {location: "query", name: property, message: "Invalid Query Parameter '" + property + "'" + (type ? ", it is not a valid " + type : "")};
    return function (req, res, next) {
        var value = req.query[property];
        if (regexp.test(value)) {
            req.attached[property] = value;
        } else {
            req.errors.push(eNotPassed);
        }
        next();
    };
};

exports.query.mandatory.regexp = function (property, regexp, type) {
    var eMissing = {location: "query", name: property, message: "Missing Query Parameter '" + property + "'" },
        uRegExp = exports.query.unchecked.regexp(property, regexp, type);
    return function (req, res, next) {
        if (req.query[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uRegExp(req, res, next);
        }
    };
};

exports.query.optional.regexp = function (property, regexp, type, dvalue) {
    var uRegExp = exports.query.unchecked.regexp(property, regexp, type);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.query[property] === undefined) {
                next();
            } else {
                uRegExp(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.query[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uRegExp(req, res, next);
            }
        };
    }
};

/**
 * Body Params
 */

exports.body = {
    mandatory: {},
    optional: {},
    unchecked: {},
};

exports.body.unchecked.boolean = function (property) {
    return function (req, res, next) {
        var value = req.body[property];
        req.attached[property] = (value === false || value === "false" || value === "0") ? false : true;
        next();
    };
};

exports.body.mandatory.boolean = function (property) {
    var eMissing = {location: "body", name: property, message: "Missing Body Parameter '" + property + "'" },
        uBoolean = exports.body.unchecked.boolean(property);
    return function (req, res, next) {
        if (req.body[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uBoolean(req, res, next);
        }
    };
};

exports.body.optional.boolean = function (property, dvalue) {
    var uBoolean = exports.body.unchecked.boolean(property);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                next();
            } else {
                uBoolean(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.query[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uBoolean(req, res, next);
            }
        };
    }
};

exports.body.unchecked.string = function (property, empty) {
    var eEmpty = {location: "body", name: property, message: "Invalid Body Parameter '" + property + "' field, it cannot be empty"},
        eNotString = {location: "body", name: property, message: "Invalid Body Parameter '" + property + "', it is not a string"},
        checkValue;
    if (empty) {
        checkValue = function (value, req) {
            if (value !== undefined) {
                if (value !== "") {
                    req.errors.push(eEmpty);
                    return false;
                }
            } else {
                req.errors.push(eNotString);
                return false;
            }
            return true;
        };
    } else {
        checkValue = function (value, req) {
            if (value === undefined) {
                req.errors.push(eNotString);
                return false;
            }
            return true;
        };
    }
    return function (req, res, next) {
        var value = req.body[property].toString();
        if (checkValue(value, req)) {
            req.attached[property] = value;
        }
        next();
    };
};

exports.body.mandatory.string = function (property, empty) {
    var eMissing = {location: "body", name: property, message: "Missing Body Parameter '" + property + "'" },
        uString = exports.body.unchecked.string(property, empty);
    return function (req, res, next) {
        if (req.body[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uString(req, res, next);
        }
    };
};

exports.body.optional.string = function (property, empty, dvalue) {
    var uString = exports.body.unchecked.string(property, empty);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                next();
            } else {
                uString(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uString(req, res, next);
            }
        };
    }
};

exports.body.unchecked.integer = function (property, min, max) {
    var eOutOfBound = {location: "body", name: property, message: "Invalid '" + property + "' parameter, out of bound"},
        eNotNumber = {location: "body", name: property, message: "Invalid '" + property + "' parameter, it is not a number"},
        checkValue;
    if (min === undefined) {
        if (max === undefined) {
            checkValue = function (value, req) {
                if (value === undefined || Math.floor(value) !== value) {
                    req.errors.push(eNotNumber);
                    return false;
                }
                return true;
            };
        } else {
            checkValue = function (value, req) {
                if (value !== undefined && Math.floor(value) === value) {
                    if (value > max) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotNumber);
                    return false;
                }
                return true;
            };
        }
    } else {
        if (max === undefined) {
            checkValue = function (value, req) {
                if (value !== undefined && Math.floor(value) === value) {
                    if (value < min) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotNumber);
                    return false;
                }
                return true;
            };
        } else {
            checkValue = function (value, req) {
                if (value !== undefined && Math.floor(value) === value) {
                    if (value < min || value > max) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotNumber);
                    return false;
                }
                return true;
            };
        }
    }
    return function (req, res, next) {
        var value = partialToInt(req.body[property]);
        if (checkValue(value, req)) {
            req.attached[property] = value;
        }
        next();
    };
};

exports.body.mandatory.integer = function (property, min, max) {
    var eMissing = {location: "body", name: property, message: "Missing Body Parameter '" + property + "'" },
        uInteger = exports.body.unchecked.integer(property, min, max);
    return function (req, res, next) {
        if (req.body[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uInteger(req, res, next);
        }
    };
};

exports.body.optional.integer = function (property, min, max, dvalue) {
    var uInteger = exports.body.unchecked.integer(property, min, max);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                next();
            } else {
                uInteger(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uInteger(req, res, next);
            }
        };
    }
};

exports.body.unchecked.id = function (Model) {
    var property = Model.pname,
        modelName = Model.modelName,
        uInteger = exports.body.unchecked.integer(property, 0),
        getId = function (req, res, next) {
            if (req.attached[property] === undefined) {
                next();
            } else {
                Model.findOne({_id : req.attached[property]}, function (err, obj) {
                    if (err) {
                        next(err);
                    } else if (obj) {
                        req.attached[property] = obj;
                        next();
                    } else {
                        req.errors.push({location: "body", name: property, message: "Unable to find " + modelName
                                         + " " + req.attached[property]
                                         + " in Body Parameter '"
                                         + property + "'"});
                        next();
                    }
                });
            }
        };
    return function (req, res, next) {
        uInteger(req, res, function (err) {
            if (err) {
                next(err);
            } else {
                getId(req, res, next);
            }
        });
    };
};

exports.body.mandatory.id = function (Model) {
    var eMissing = {location: "body", name: Model.pname, message: "Missing Body Parameter '" + Model.pname + "'" },
        uId = exports.body.unchecked.id(Model);
    return function (req, res, next) {
        if (req.body[Model.pname] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uId(req, res, next);
        }
    };
};

exports.body.optional.id = function (Model) {
    var uId = exports.body.unchecked.id(Model);
    return function (req, res, next) {
        if (req.body[Model.pname] === undefined) {
            next();
        } else {
            uId(req, res, next);
        }
    };
};

exports.body.unchecked.float = function (property, min, max) {
    var eOutOfBound = {location: "body", name: property, message: "Invalid '" + property + "' parameter, out of bound"},
        eNotFloat = {location: "body", name: property, message: "Invalid '" + property + "' parameter, it is not a float"},
        checkValue;
    if (min === undefined) {
        if (max === undefined) {
            checkValue = function (value, req) {
                if (value === undefined) {
                    req.errors.push(eNotFloat);
                    return false;
                }
                return true;
            };
        } else {
            checkValue = function (value, req) {
                if (value !== undefined) {
                    if (value > max) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotFloat);
                    return false;
                }
                return true;
            };
        }
    } else {
        if (max === undefined) {
            checkValue = function (value, req) {
                if (value !== undefined) {
                    if (value < min) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotFloat);
                    return false;
                }
                return true;
            };
        } else {
            checkValue = function (value, req) {
                if (value !== undefined) {
                    if (value < min || value > max) {
                        req.errors.push(eOutOfBound);
                        return false;
                    }
                } else {
                    req.errors.push(eNotFloat);
                    return false;
                }
                return true;
            };
        }
    }
    return function (req, res, next) {
        var value = partialToFloat(req.body[property]);
        if (checkValue(value, req)) {
            req.attached[property] = value;
        }
        next();
    };
};

exports.body.mandatory.float = function (property, min, max) {
    var eMissing = {location: "body", name: property, message: "Missing Body Parameter '" + property + "'" },
        uFloat = exports.body.unchecked.float(property, min, max);
    return function (req, res, next) {
        if (req.body[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uFloat(req, res, next);
        }
    };
};

exports.body.optional.float = function (property, min, max, dvalue) {
    var uFloat = exports.body.unchecked.float(property, min, max);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                next();
            } else {
                uFloat(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uFloat(req, res, next);
            }
        };
    }
};

exports.body.unchecked.regexp = function (property, regexp, type) {
    var eNotValid = {location: "body", name: property, message: "Invalid Body Parameter '" + property + "'" + (type ? ", it is not a valid " + type : "")};
    return function (req, res, next) {
        var value = req.body[property];
        if (regexp.test(value)) {
            req.attached[property] = value;
        } else {
            req.errors.push(eNotValid);
        }
        next();
    };
};

exports.body.mandatory.regexp = function (property, regexp, type) {
    var eMissing = {location: "body", name: property, message: "Missing Body Parameter '" + property + "'" },
        uRegExp = exports.body.unchecked.regexp(property, regexp, type);
    return function (req, res, next) {
        if (req.body[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uRegExp(req, res, next);
        }
    };
};

exports.body.optional.regexp = function (property, regexp, type, dvalue) {
    var uRegExp = exports.body.unchecked.regexp(property, regexp, type);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                next();
            } else {
                uRegExp(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uRegExp(req, res, next);
            }
        };
    }
};

exports.body.mandatory.base64 = function (property) {
    return exports.body.mandatory.regexp(property, base64, "Base64 String");
};

exports.body.optional.base64 = function (property, dvalue) {
    return exports.body.optional.regexp(property, base64, "Base64 String", dvalue);
};

exports.body.unchecked.array = function (property, check, map) {
    var eInvalidItem = {location: "body", name: property, message: "Invalid Body Parameter '" + property + "', some Array items are not valid"},
        eNotArray = {location: "body", name: property, message: "Invalid Body Parameter '" + property + "', it is not an Array"},
        checkValue;
    if (typeof check === "function") {
        checkValue = function (value, req) {
            if (value !== undefined) {
                if (!_.every(value, check, {req: req})) {
                    req.errors.push(eInvalidItem);
                    return false;
                }
            } else {
                req.errors.push(eNotArray);
                return false;
            }
            return true;
        };
    } else {
        checkValue = function (value, req) {
            if (value === undefined) {
                req.errors.push(eNotArray);
                return false;
            }
            return true;
        };
    }
    if (typeof map === "function") {
        return function (req, res, next) {
            var value = req.body[property];
            if (checkValue(value, req, {req: req})) {
                req.attached[property] = _.map(value, map);
            }
            next();
        };
    } else {
        return function (req, res, next) {
            var value = req.body[property];
            if (checkValue(value, req)) {
                req.attached[property] = value;
            }
            next();
        };
    }
};

exports.body.mandatory.array = function (property, check, map) {
    var eMissing = {location: "body", name: property, message: "Missing Body Parameter '" + property + "'" },
        uArray = exports.body.unchecked.array(property, check, map);
    return function (req, res, next) {
        if (req.body[property] === undefined) {
            req.errors.push(eMissing);
            next();
        } else {
            uArray(req, res, next);
        }
    };
};

exports.body.optional.array = function (property, check, map, dvalue) {
    var uArray = exports.body.unchecked.array(property, check, map);
    if (dvalue === undefined) {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                next();
            } else {
                uArray(req, res, next);
            }
        };
    } else {
        return function (req, res, next) {
            if (req.body[property] === undefined) {
                req.attached[property] = dvalue;
                next();
            } else {
                uArray(req, res, next);
            }
        };
    }
};