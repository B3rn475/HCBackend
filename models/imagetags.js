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

var schema = mongoose.Schema({ image: {type: Number, min: 0, index: true, ref: "Image"},
                            tags : [{type: Number, min: 0, ref: "Tag"}],
                            tags_set : [{type: Number, min: 0, ref: "Tag"}],
                            count: {type: Number, min: 0, index: true}
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });

schema.options.toJSON = {
    transform: function (doc, ret, options) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
};

schema.index({image: 1, count: 1});

exports.schema = schema;

var model = mongoose.model('ImageTags',
                           schema,
                           'ImageTags');

exports.model = model;