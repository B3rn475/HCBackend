/*jslint node: true, nomen: true, es5: true */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");

var computeMediaLocator = function (id) {
    return "/storage/mask/" + id + ".png";
};

var minId = 0;

var schema = mongoose.Schema({ _id: { type: Number, min: minId, index: { unique: true }, select: false},
                                    quality: { type: Number},
                                    segmentations: { type: Number, min: 1},
                                    updated_at: {type: Date}
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });
schema.virtual('mediaLocator').get(function () { return computeMediaLocator(this._id); });

schema.pre('save', function(next){
  now = new Date();
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

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'Mask', field: '_id' });

var model = mongoose.model('Mask',
                           schema,
                           'Mask');

exports.model = model;