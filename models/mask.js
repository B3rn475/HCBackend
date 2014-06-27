/*jslint node: true, nomen: true, es5: true */
/**
 * Developed By Carlo Bernaschina (GitHub - B3rn475)
 * www.bernaschina.com
 *
 * Copyright (c) 2014 Politecnico di Milano  
 * www.polimi.it
 *
 * Distributed under the MIT Licence
 */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");

var computeMediaLocator = function (id) {
    return "/storage/mask/" + id + ".png";
};

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                    image: {type: Number, min: 0, ref: "Image"},
                                    tag: {type: Number, min: 0, ref: "Tag"},
                                    quality: { type: Number},
                                    segmentations: { type: Number, min: 1},
                                    updated_at: {type: Date}
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });
schema.virtual('mediaLocator').get(function () { return computeMediaLocator(this._id); });

schema.pre('save', function (next) {
    var now = new Date();
    this.updated_at = now;
    next();
});

schema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        ret.mediaLocator = doc.mediaLocator;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
};

schema.statics.getMediaLocationFromID = function (id) {
    return computeMediaLocator(id);
};

schema.statics.json_list_property = "masks";
schema.statics.pname = "mask";

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'Mask', field: '_id' });

var model = mongoose.model('Mask',
                           schema,
                           'Mask');

exports.model = model;