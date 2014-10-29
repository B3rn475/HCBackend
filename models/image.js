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

var ImageTags = require("./imagetags.js").model;

var computeMediaLocator = function (id) {
    return "/storage/image/" + id + ".jpg";
};

exports.regexp = {};
exports.regexp.location = /^(head|torso|left_arm|right_arm|legs|feet)$/;

var part = mongoose.Schema({location: {type: String, enum: ["head", "torso", "left_arm", "right_arm", "legs", "feet"]},
                            x0 : { type: Number, min: 0},
                            y0 : { type: Number, min: 0},
                            x1 : { type: Number, min: 0},
                            y1 : { type: Number, min: 0}},
                           {_id: false, id: false});

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                    width: { type: Number, min: 1},
                                    height: { type: Number, min: 1},
                                    pose: [part],
                                    source: { type: String }
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });
schema.virtual('mediaLocator').get(function () { return computeMediaLocator(this._id); });

schema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        ret.mediaLocator = doc.mediaLocator;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
};

schema.post('save', function () {
    ImageTags.update({image: this._id}, {$inc: {count: 0}}, {upsert: true}, function (err) { if (err) { console.log(err); } });
});


schema.statics.json_list_property = "images";
schema.statics.pname = "image";

schema.statics.getMediaLocationFromID = function (id) {
    return computeMediaLocator(id);
};

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'Image', field: '_id' });

var model = mongoose.model('Image',
                           schema,
                           'Image');

exports.model = model;