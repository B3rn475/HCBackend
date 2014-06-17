/*jslint node: true, nomen: true, es5: true */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                started_at: {type: Date},
                                completed_at: {type: Date}
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });

schema.pre('save', function (next) {
    if (this.started_at === undefined) {
        var now = new Date();
        this.started_at = now;
    }
    next();
});

schema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
};

schema.statics.json_list_property = "sessions";
schema.statics.pname = "session";

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'Session', field: '_id' });

var model = mongoose.model('Session',
                           schema,
                           'Session');

exports.model = model;