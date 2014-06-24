/*jslint node: true, nomen: true, es5: true */
"use strict";

var mongoose = require("mongoose");
var mongooseAI = require("mongoose-auto-increment");

exports.regexp = {};

exports.regexp.color = /#([a-f]|[A-F]|[0-9]){3}(([a-f]|[A-F]|[0-9]){3})?\b/;

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                    session: {type: Number, min: 0, ref: "Session"},
                                    image: {type: Number, min: 0, ref: "Image"},
                                    tag: {type: Number, min: 0, ref: "Tag"},
                                    user: {type: Number, min: 0, ref: "User"},
                                    type: {type: String, enum: ["tagging", "segmentation", "upload"]},
                                    segmentation: { type: mongoose.Schema.Types.Mixed},
                                    created_at: {type: Date},
                                    completed_at: {type: Date},
                                    validity: {type: Boolean, default: true}
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });

schema.post('init', function (doc) {
    if (doc.segmentation !== undefined && doc.segmentation.points !== undefined && doc.segmentation.quality === undefined) {
        doc.segmentation = undefined;
    }
});

schema.pre('save', function (next) {
    if (this.created_at === undefined) {
        this.created_at = new Date();
    }
    if (this.completed_at === undefined) {
        if (this.type === "tagging" && this.tag !== undefined) {
            this.completed_at = new Date();
        }
        if (this.type === "segmentation" && this.segmentation !== undefined) {
            this.completed_at = new Date();
        }
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