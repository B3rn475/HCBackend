/*jslint node: true, nomen: true, es5: true */
/**
 * Developed By Carlo Bernaschina (B3rn475)
 * www.bernaschina.scom
 *
 * Copyright (c) 2014 Politecnico di Milano  
 * www.polimi.it
 *
 * Distributed under the MIT Licence
 */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");
var Action = require("./action.js").model;
var async = require("async");

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                    app_id: { type: Number, min: 0},
                                    app_user_id: { type: String},
                                    quality: { type: Number},
                                    statistics: { type: mongoose.Schema.Types.Mixed}
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });

schema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
};

schema.statics.json_list_property = "users";
schema.statics.pname = "user";

schema.methods.computeFields = function (cb) {
    var obj = this;
    obj.statistics = {};
    async.parallel([
        function (next) {
            Action.count({ user: obj.id },
                function (err, count) {
                    if (err) {
                        next(err);
                    } else {
                        obj.statistics.actions = count;
                        next();
                    }
                });
        },
        function (next) {
            Action.aggregate([{$match: {user: obj.id}}, {$group : {_id: "session"}}, {$group : {_id: null, count : {$sum : 1}}}],
                function (err, result) {
                    if (err) {
                        next(err);
                    } else {
                        if (result.length === 0) {
                            obj.statistics.sessions = 0;
                        } else {
                            obj.statistics.sessions = result[0].count;
                        }
                        next();
                    }
                });
        }
    ], function (err) {
        cb(err, obj);
    });
};

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'User', field: '_id' });

var model = mongoose.model('User',
                           schema,
                           'User');

exports.model = model;