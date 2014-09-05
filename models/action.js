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

var mongoose = require("mongoose"),
    mongooseAI = require("mongoose-auto-increment"),
    ImageTags = require("./imagetags.js").model,
    ImageSegmentations = require("./imagesegmentations.js").model;

exports.regexp = { points: {}, history: {}, params: {}, query: {}};

exports.regexp.color = /(rgb\(([0-1][0-9]{2}|2[0-4][0-9]|25[0-5]|[0-9]{2}|[0-9]),[ ]*([0-1][0-9]{2}|2[0-4][0-9]|25[0-5]|[0-9]{2}|[0-9]),[ ]*([0-1][0-9]{2}|2[0-4][0-9]|25[0-5]|[0-9]{2}|[0-9])\))|(rgba\(([0-1][0-9]{2}|2[0-4][0-9]|25[0-5]|[0-9]{2}|[0-9]),[ ]*([0-1][0-9]{2}|2[0-4][0-9]|25[0-5]|[0-9]{2}|[0-9]),[ ]*([0-1][0-9]{2}|2[0-4][0-9]|25[0-5]|[0-9]{2}|[0-9]),[ ]*(1|0|1\.0|0\.[0-9]+)\))/;

exports.regexp.params.type = /tagging|segmentation$/;
exports.regexp.query.type = /tagging|segmentation|upload$/;

var schema = mongoose.Schema({ _id: { type: Number, min: 0, index: { unique: true }, select: false},
                                    session: {type: Number, min: 0, index: true, ref: "Session"},
                                    image: {type: Number, min: 0, index: true, ref: "Image"},
                                    tag: {type: Number, min: 0, index: true, ref: "Tag"},
                                    user: {type: Number, min: 0, index: true, ref: "User"},
                                    type: {type: String, index: true, enum: ["tagging", "segmentation", "upload"]},
                                    segmentation: { type: mongoose.Schema.Types.Mixed},
                                    created_at: {type: Date, index: true},
                                    completed_at: {type: Date, index: true},
                                    validity: {type: Boolean, default: true}
                                }, { id: false});

schema.virtual('id').get(function () { return this._id; });

schema.post('init', function (doc) {
    if (doc.segmentation !== undefined && doc.segmentation.points !== undefined && doc.segmentation.quality === undefined) {
        doc.segmentation = undefined;
    }
});

schema.pre('save', function (next) {
    this.wasNew = this.isNew;
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
    if (this.validity === undefined) {
        this.validity = true;
    }
    this.wasCompletedAtModified = this.isModified("completed_at");
    this.wasValidityModified = this.isModified("validity");
    this.wasSegmentationModified = this.isModified("segmentation");
    next();
});

schema.post('save', function () {
    var addAndUpdate = false,
        me = this;
    if (this.type === "tagging") {
        if (this.wasNew) {
            if (this.tag === undefined) {
                if (this.completed_at === undefined) {
                    ImageTags.update({image: this.image}, {$inc: {count: 1}}, function (err) { if (err) { console.log(err); } });
                }
            } else {
                addAndUpdate = true;
            }
        } else {
            if (this.wasCompletedAtModified) {
                ImageTags.update({image: this.image}, {$inc: {count: -1}}, function (err) { if (err) { console.log(err); } });
                if (this.tag !== undefined) {
                    addAndUpdate = true;
                }
            } else {
                if (this.wasValidityModified) {
                    if (this.validity) {
                        addAndUpdate = true;
                    } else {
                        exports.model.count({type: "tagging", image: this.image, tag: this.tag, validity: true}, function (err, count) {
                            if (err) {
                                console.log(err);
                            } else {
                                if (count === 0) {
                                    ImageSegmentations.update({image: me.image, tags: me.tag}, {$set: {validity: false}}, function (err) { if (err) { console.log(err); } });
                                    ImageTags.update({image: me.image, tags: {$in: [me.tag]}}, {$inc: {count: -1}, $pull: {tags: me.tag}}, function (err) { if (err) { console.log(err); } });
                                }
                            }
                        });
                    }
                }
            }
        }
        if (addAndUpdate) {
            ImageTags.findOneAndUpdate({image: this.image, tag: {$nin: [this.tag]}}, {$addToSet: {tags: this.tag}, $inc: {count: 1}}, function (err) { if (err) { console.log(err); } });
            ImageSegmentations.update({image: this.image, tag: this.tag}, {$inc: {count: 0}, $set: {validity: true}}, {upsert: true}, function (err) { if (err) { console.log(err); } });
        }
    } else if (this.type === "segmentation") {
        if (this.wasNew) {
            if (this.completed_at === undefined || this.segmentation !== undefined) {
                ImageSegmentations.update({image: this.image, tag: this.tag}, {$inc: {count: 1}}, {upsert: true}, function (err) { if (err) { console.log(err); } });
            }
        } else {
            if (this.wasCompletedAtModified) {
                if (this.segmentation === undefined) {
                    ImageSegmentations.update({image: this.image, tag: this.tag}, {$inc: {count: -1}}, {upsert: true}, function (err) { if (err) { console.log(err); } });
                }
            } else {
                if (this.segmentation !== undefined) {
                    if (this.wasValidityModified) {
                        if (this.validity) {
                            ImageSegmentations.update({image: this.image, tag: this.tag}, {$inc: {count: 1}}, {upsert: true}, function (err) { if (err) { console.log(err); } });
                        } else {
                            ImageSegmentations.update({image: this.image, tag: this.tag}, {$inc: {count: -1}}, {upsert: true}, function (err) { if (err) { console.log(err); } });
                        }
                    }
                }
            }
        }
    }
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

schema.plugin(mongooseAI.plugin, { model: 'Action', field: '_id' });

var model = mongoose.model('Action',
                           schema,
                           'Action');

exports.model = model;
