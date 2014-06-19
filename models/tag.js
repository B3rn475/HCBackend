/*jslint node: true, nomen: true, es5: true */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");

/**
 * RegExps
 */

exports.regexp = {};

exports.regexp.language = /[a-z]{2}\-[A-Z]{2}$/;
exports.regexp.name = /[a-zA-Z ]+$/;

var alias = mongoose.Schema({language: {type: String, validate: exports.regexp.language}, name: {type: String, validate: exports.regexp.language}}, { id: false, _id: false});

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                name: { type: String, index: { unique: true }, validate: exports.regexp.name },
                                aliases : [alias]
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

schema.pre('save', function (next) {
    if (this.aliases === undefined) {
        this.aliases = [];
    }
    next();
});

schema.statics.json_list_property = "tags";
schema.statics.pname = "tag";

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'Tag', field: '_id' });

var model = mongoose.model('Tag',
                           schema,
                           'Tag');

exports.model = model;