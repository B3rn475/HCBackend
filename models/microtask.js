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

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                    type: {type: String, enum: ["tagging", "segmentation"]},
                                    task: {type: Number, min: 0, ref: "Task"},
                                    action: {type: Number, min: 0, ref: "Action"},
                                    order: {type: Number, min: 0},
                                    created_at: {type: Date},
                                    completed_at: {type: Date}
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });

schema.pre('save', function (next) {
    if (this.created_at === undefined) {
        var now = new Date();
        this.created_at = now;
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

schema.statics.json_list_property = "microtasks";
schema.statics.pname = "microtask";

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'Microtasks', field: '_id' });

var model = mongoose.model('Microtask',
                           schema,
                           'Microtasks');

exports.model = model;