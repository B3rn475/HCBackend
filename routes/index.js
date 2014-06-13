/*jslint node: true, nomen: true, es5: true */
"use strict";

var _ = require("underscore-node");

exports.middlewares = {};
exports.routes = {};
exports.query = {};
exports.algorithms = {json: {}, html: {}};
exports.params = {};
exports.body = {};

exports.middlewares.init = function (req, res, next) {
    req.attached = {};
    next();
};

exports.routes.index = function (req, res) {
    res.format({
        html: function () {
            res.send('server up and running');
        },
        json: function () {
            res.send({ status: "OK", message: 'server up and running' });
        }
    });
};

exports.routes.invalidRoute = function (req, res) {
    res.format({
        html: function () {
            res.send(404, 'invalid route');
        },
        json: function () {
            res.send(404, { status: "KO", error: 'invalid route' });
        }
    });
};

exports.query.populate = function (req, res, next) {
    exports.query.boolean(req, res, next, "populate");
};

exports.query.count = function (req, res, next) {
    exports.query.number_min_max_value(req, res, next, "count", 0, undefined, 100);
};

exports.query.max_id = function (req, res, next) {
    exports.query.number_min_max_value(req, res, next, "max_id", 0, undefined, undefined, false);
};

exports.query.since_id = function (req, res, next) {
    exports.query.number_min_max_value(req, res, next, "since_id", 0, undefined, undefined, false);
};

exports.query.boolean = function (req, res, next, property) {
    req.attached[property] = (req.query[property] === undefined || req.query[property] === "false" || req.query[property] === "0") ? false : true;
    next();
};

exports.query.number_min_max_value = function (req, res, next, property, min, max, dvalue, mandatory) {
    var error,
        iValue = req.query[property],
        oValue;
    if (iValue === undefined) {
        if (dvalue === undefined) {
            if (!mandatory) {
                next();
                return;
            }
            error = "Missing '" + property + "' parameter";
        } else {
            oValue = dvalue;
        }
    } else {
        iValue = iValue.toString();
        oValue = parseInt(iValue, 10);
        if (oValue.toString() !== iValue) {
            error = "Invalid '" + property + "' parameter, it is not a number";
        } else {
            if ((min && oValue < min) || (max && oValue > max)) {
                error = "Invalid '" + property + "' parameter, out of bound";
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
        req.attached[property] = oValue;
        next();
    }
};

exports.algorithms.json.get = function (req, res, next, Model, populate) {
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
};

exports.algorithms.html.get = function (req, res, next, Model) {
    res.send(501, "not implemented");
};

exports.algorithms.json.list = function (req, res, next, Model, conditions, fields, options) {
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
};

exports.algorithms.json.add = function (req, res, next, Model, obj, savecb) {
    if (obj === undefined) {
        obj = {};
    }
    if (savecb !== undefined && typeof (savecb) !== "function") {
        savecb = undefined;
    }
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
};

exports.algorithms.html.list = function (req, res, next, Model, conditions, fields, options) {
    res.send(501, "not implemented");
};

exports.algorithms.html.add = function (req, res, next, Model, obj, savecb) {
    req.send(501, "not implemented");
};

exports.params.id = function (req, res, next, Model, inId) {
    var error,
        idStr = inId.toString(),
        id = parseInt(idStr.toString(), 10);
    if (idStr !== id.toString()) {
        error = "Invalid " + Model.modelName + " 'id', it is not a number";
    } else {
        if (id < 0) {
            error = "Invalid " + Model.modelName + " 'id', must be greater than 0";
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
        Model.findOne({_id : id}, function (err, obj) {
            if (err) {
                next(err);
            } else if (obj) {
                req.attached[Model.pname] = obj;
                next();
            } else {
                err = "Unable to find " + Model.pname + " " + id;
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

exports.params.regexp = function (req, res, next, property, exp, value) {
    var error;
    if (!exp.test(value)) {
        error = "Invalid '" + property + "' field, it is not a valid value";
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
        req.attached[property] = value;
        next();
    }
};

exports.body.id = function (req, res, next, Model) {
    exports.body.number_min_max_value(req, res, function () {
        Model.findOne({_id : req.attached[Model.pname]}, function (err, obj) {
            if (err) {
                next(err);
            } else if (obj) {
                req.attached[Model.pname] = obj;
                next();
            } else {
                err = "Unable to find " + Model.modelName + " " + req.attached[Model.pname] + " in '" + Model.pname + "'";
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
    }, Model.pname, 0);
};

exports.body.number_min_max_value = function (req, res, next, property, min, max, dvalue) {
    var error,
        iValue = req.body[property],
        oValue;
    if (iValue === undefined) {
        if (dvalue === undefined) {
            error = "Missing '" + property + "' field";
        } else {
            oValue = dvalue;
        }
    } else {
        iValue = iValue.toString();
        oValue = parseInt(iValue, 10);
        if (oValue.toString() !== iValue) {
            error = "Invalid '" + property + "', it is not an integer number";
        } else {
            if ((min && oValue < min) || (max && oValue > max)) {
                error = "invalid '" + property + "' field, out of bound";
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
        req.attached[property] = oValue;
        next();
    }
};

exports.body.float_min_max_value = function (req, res, next, property, min, max, dvalue) {
    var error,
        iValue = req.body[property],
        oValue;
    if (iValue === undefined) {
        if (dvalue === undefined) {
            error = "Missing '" + property + "' field";
        } else {
            oValue = dvalue;
        }
    } else {
        iValue = iValue.toString();
        oValue = parseFloat(iValue, 10);
        if (oValue.toString() !== iValue) {
            error = "Invalid '" + property + "', it is not a floating point number";
        } else {
            if ((min && oValue < min) || (max && oValue > max)) {
                error = "invalid '" + property + "' field, out of bound";
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
        req.attached[property] = oValue;
        next();
    }
};

exports.body.base64_value = function (req, res, next, property) {
    var error,
        value = req.body[property];
    if (value === undefined) {
        error = "Missing '" + property + "' field";
    } else {
        if (new RegExp("!^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$").test(value)) {
            error = "Invalid '" + property + "' field, it is not a valid base64 string";
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
        req.attached[property] = value;
        next();
    }
};

exports.body.regexp = function (req, res, next, property, exp) {
    var error,
        value = req.body[property];
    if (value === undefined) {
        error = "Missing '" + property + "' field";
    } else {
        if (!exp.test(value)) {
            error = "Invalid '" + property + "' field, it is not a valid value";
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
        req.attached[property] = value;
        next();
    }
};

exports.body.array = function (req, res, next, property, checkcb, mapper) {
    var error,
        array;
    try {
        array = JSON.parse(req.body[property]);
        if (array === undefined) {
            error = "Missing '" + property + "' field";
        } else {
            if (_.isArray(array)) {
                if (checkcb !== undefined) {
                    if (!_.every(array, checkcb)) {
                        error = "Invalid '" + property + "' field, some array items are not valid";
                    }
                }
            } else {
                error = "Invalid '" + property + "' field, it is not an array";
            }
        }
    } catch (ex) {
        error = "Invalid '" + property + "' field";
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
        if (mapper) {
            req.attached[property] = _.map(array, mapper);
        } else {
            req.attached[property] = array;
        }
        next();
    }
};