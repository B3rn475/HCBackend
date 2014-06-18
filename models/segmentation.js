/*jslint node: true, nomen: true, es5: true */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");

exports.regexp = {};
exports.regexp.color = /#([a-f]|[A-F]|[0-9]){3}(([a-f]|[A-F]|[0-9]){3})?\b/;

var point = mongoose.Schema({ x: { type: Number, min: 0},
                                y: { type: Number, min: 0},
                                color: {type: String, validate: exports.regexp.color},
                                removed: {type: Boolean},
                                quality: { type: Number}
                                }, { id: false, _id: false});

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                    points: [point]
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

schema.statics.json_list_property = "segmentations";
schema.statics.pname = "segmentation";

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'Segmentation', field: '_id' });

var model = mongoose.model('Segmentation',
                           schema,
                           'Segmentation');

exports.model = model;