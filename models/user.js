/*jslint node: true, nomen: true, es5: true */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");

var minId = 0;

var schema = mongoose.Schema({ _id: { type: Number, min: minId, index: { unique: true }, select: false},
                                    app_id: { type: Number, min: 1},
                                    app_user_id: { type: Number, min: 1}
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

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'User', field: '_id' });

var model = mongoose.model('User',
                           schema,
                           'User');

exports.model = model;