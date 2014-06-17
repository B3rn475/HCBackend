/*jslint node: true, nomen: true, es5: true */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                    image: {type: Number, min: 0, ref: "Image"},
                                    tag: {type: Number, min: 0, ref: "Tag"},
                                    user: {type: Number, min: 0, ref: "User"},
                                    type: {type: String, enum: ["tagging", "segmentation"]},
                                    segmentation: {type: Number, min: 0, ref: "Segmentation"},
                                    started_at: {type: Date},
                                    ended_at: {type: Date}
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

schema.statics.json_list_property = "actions";
schema.statics.pname = "action";

exports.schema = schema;

schema.plugin(mongooseAI.plugin, { model: 'ACtion', field: '_id' });

var model = mongoose.model('Action',
                           schema,
                           'Action');

exports.model = model;