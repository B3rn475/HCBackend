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

/**
 * RegExps
 */

exports.regexp = {};

exports.regexp.name = /[a-zA-Z ]+$/;

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                name: { type: String, index: { unique: true }, validate: exports.regexp.name },
                                images : [{type: Number, min: 0, ref: "Image"}]
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

schema.statics.json_list_property = "collections";
schema.statics.pname = "collection";

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'Collection', field: '_id' });

var model = mongoose.model('Collection',
                           schema,
                           'Collection');

exports.model = model;