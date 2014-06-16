/*jslint node: true, nomen: true, es5: true */
"use strict";
/**
 * Module dependencies.
 */

var clc = require("cli-color");
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var mongoose = require('mongoose');
var mongooseAI = require('mongoose-auto-increment');
var app = express();

/**
 * Configuration
 */

var env = process.env.NODE_ENV || 'development';

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser({ limit: '1MB'}));
app.use(methodOverride());

/**
 * DB
 */

var db = process.env.db || 'mongodb://localhost/test';

var connection = mongoose.connect(db);
// When successfully connected
mongoose.connection.once('open', function () {
    console.log(clc.green("Connected to database at: ") + db);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log(clc.red('Mongoose default connection error: ') + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log(clc.red('Mongoose default connection disconnected'));
});

mongooseAI.initialize(connection);

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(1);
    });
});

/**
 * Routes
 */

var index = require("./routes");

app.use(index.middlewares.init);

var image = require("./routes/image.js");
var task = require("./routes/task.js");
var session = require("./routes/session.js");
var mask = require("./routes/mask.js");
var tag = require("./routes/tag.js");
var action = require("./routes/action.js");
var segmentation = require("./routes/segmentation.js");
var user = require("./routes/user.js");
var collection = require("./routes/collection");

/**
 * Routes Params
 */

app.param("imageId", image.params.id);
app.param("userId", user.params.id);
app.param("tagId", tag.params.id);
app.param("taskId", task.params.id);
app.param("sessionId", session.params.id);
app.param("maskId", mask.params.id);
app.param("actionId", action.params.id);
app.param("segmentationId", segmentation.params.id);
app.param("collectionId", collection.params.id);
app.param("language", tag.params.language);


/**
 * Get Routes
 */

app.get("/image/:imageId", index.query.optional.populate,
        image.routes.get);
app.get("/user/:userId", user.routes.get);
app.get("/tag/:tagId", tag.routes.get);
app.get("/task/:taskId", index.query.optional.populate,
        task.routes.get);
app.get("/session/:sessionId", index.query.optional.populate,
        session.routes.get);
app.get("/mask/:maskId", index.query.optional.populate,
        mask.routes.get);
app.get("/action/:actionId", index.query.optional.populate,
        action.routes.get);
app.get("/segmentation/:segmentationId", index.query.optional.populate,
        segmentation.routes.get);
app.get("/collection/:collectionId", index.query.optional.populate,
        collection.routes.get);

/**
 * Update Routes
 */

app.put("/session/:sessionId", session.checkers.open,
        session.routes.close);
app.put("/mask/:maskId", mask.body.mandatory.payload,
        mask.body.mandatory.quality,
        mask.body.mandatory.segmentations,
        mask.routes.update);
app.put("/action/:actionId", action.checkers.open,
        action.body.route.close.tag,
        action.body.route.close.segmentation,
        action.routes.close);


/**
 * Add Routes
 */

app.post("/image", image.body.mandatory.width,
         image.body.mandatory.height,
         image.body.mandatory.payload,
         image.routes.add);
app.post("/user", user.body.mandatory.app_id,
         user.body.mandatory.app_user_id,
         user.routes.add);
app.post("/tag", tag.routes.add);
app.post("/tag/:tagId/alias", tag.body.mandatory.language,
         tag.body.mandatory.name,
         tag.routes.addAlias);
app.post("/session/:sessionId/action", session.checkers.open,
         action.body.mandatory.id,
         session.routes.addAction);
app.post("/session", session.routes.add);
app.post("/mask", image.body.mandatory.id,
         tag.body.mandatory.id,
         mask.body.mandatory.payload,
         mask.body.mandatory.quality,
         mask.body.mandatory.segmentations,
         mask.routes.add);
app.post("/action", image.body.mandatory.id,
         user.body.mandatory.id,
         action.body.mandatory.type,
         action.body.route.add.tag,
         action.routes.add);
app.post("/segmentation", segmentation.body.mandatory.points,
         segmentation.routes.add);
app.post("/collection/:collectionId/image", image.body.mandatory.id,
         collection.routes.addImage);
app.post("/collection", collection.routes.add);

/**
 * Delete Routes
 */
app.delete("/collection/:collectionId/image/:imageId", collection.routes.removeImage);
app.delete("/collection/:collectionId/image", image.body.mandatory.id,
           collection.routes.removeImage);
app.delete("/tag/:tagId/alias/:language", tag.routes.removeAlias);
app.delete("/tag/:tagId/alias", tag.body.mandatory.language,
           tag.routes.removeAlias);

/**
 * Index Routes
 */

app.get("/image", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        image.routes.index);
app.get("/user", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        user.routes.index);
app.get("/tag", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        tag.routes.index);
app.get("/task", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        task.routes.index);
app.get("/session", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        session.routes.index);
app.get("/mask", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        mask.routes.index);
app.get("/action", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        action.routes.index);
app.get("/segmentation", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        segmentation.routes.index);
app.get("/collection", index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        collection.routes.index);
app.get("/", index.routes.index);

/**
 * Static Files
 */

app.use('/static', express.static(__dirname + '/public'));

/**
 * Storage
 * This files are the one uploaded to the server
 */

app.use('/storage', express.static(__dirname + '/storage'));

/**
 *Error Handling
 */

app.use(index.routes.invalidRoute);

if ('development' === env) {
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
} else if ('production' === env) {
    app.use(errorHandler());
} else {
    console.error(clc.red("Unknown environment: ") + env);
    process.exit(1);
}

/**
 * Server initialization
 */

var port = process.env.port || 3000;

app.listen(port, function () {
    console.log(clc.green("Express server listening on port ") + "%d" + clc.green(" in ") + "%s" + clc.green(" mode"), port, app.settings.env);
});
