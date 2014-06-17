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
app.use(bodyParser({ limit: '1mb'}));
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

app.route("/")
    .get(index.routes.index);

app.use(index.middlewares.init);

var image = require("./routes/image.js");
app.param("imageId", image.params.id);

var collection = require("./routes/collection");
app.param("collectionId", collection.params.id);

var user = require("./routes/user.js");
app.param("userId", user.params.id);

var tag = require("./routes/tag.js");
app.param("tagId", tag.params.id);
app.param("language", tag.params.language);

var mask = require("./routes/mask.js");
app.param("maskId", mask.params.id);

var task = require("./routes/task.js");
app.param("taskId", task.params.id);

var segmentation = require("./routes/segmentation.js");
app.param("segmentationId", segmentation.params.id);

var session = require("./routes/session.js");
app.param("sessionId", session.params.id);

var action = require("./routes/action.js");
app.param("actionId", action.params.id);

var microtask = require("./routes/microtask.js");
app.param("microtaskId", microtask.params.id);


/**
 * Image Routes
 */
app.route("/image")
    .post(image.body.mandatory.width,
        image.body.mandatory.height,
        image.body.mandatory.payload,
        image.routes.add)
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        image.routes.index);
app.route("/image/:imageId")
    .get(index.query.optional.populate,
        image.routes.get);

/**
 * Collection Routes
 */
app.route("/collection")
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        collection.routes.index)
    .post(collection.routes.add);
app.route("/collection/:collectionId")
    .get(index.query.optional.populate,
        collection.routes.get);
app.route("/collection/:collectionId/task")
    .get(index.query.optional.populate,
        task.query.optional.completed,
        task.routes.index);
app.route("/collection/:collectionId/image")
    .post(image.body.mandatory.id,
         collection.routes.addImage)
    .delete(image.body.mandatory.id,
           collection.routes.removeImage);
app.route("/collection/:collectionId/image/:imageId")
    .delete(collection.routes.removeImage);

/**
 * User Routes
 */
app.route("/user")
    .post(user.body.mandatory.app_id,
         user.body.mandatory.app_user_id,
         user.routes.add)
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        user.routes.index);
app.route("/user/:userId")
    .get(user.routes.get);

/**
 * Tag Routes
 */

app.route("/tag")
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        tag.routes.index)
    .post(tag.routes.add);
app.route("/tag/:tagId")
    .get(tag.routes.get);
app.route("/tag/:tagId/alias")
    .post(tag.body.mandatory.language,
         tag.body.mandatory.name,
         tag.routes.addAlias)
    .delete(tag.body.mandatory.language,
           tag.routes.removeAlias);
app.route("/tag/:tagId/alias/:language")
    .delete(tag.routes.removeAlias);

/**
 * Mask Routes
 */
app.route("/mask")
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        mask.routes.index)
    .post(image.body.mandatory.id,
         tag.body.mandatory.id,
         mask.body.mandatory.payload,
         mask.body.mandatory.quality,
         mask.body.mandatory.segmentations,
         mask.routes.add);
app.route("/mask/:maskId")
    .get(index.query.optional.populate,
        mask.routes.get)
    .put(mask.body.mandatory.payload,
        mask.body.mandatory.quality,
        mask.body.mandatory.segmentations,
        mask.routes.update);

/**
 * Task Routes
 */
app.route("/task")
    .get(index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         image.query.optional.id,
         collection.query.optional.id,
         task.checkers.route.index,
         task.query.optional.completed,
         task.routes.index)
    .post(image.body.mandatory.id,
         task.routes.add);
app.route("/task/:taskId")
    .get(index.query.optional.populate,
        task.routes.get)
    .post(task.routes.complete);
app.route("/task/:taskId/user")
    .post(user.body.mandatory.id,
         task.routes.addUser);
app.route("/task/:taskId/microtask")
    .get(index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         microtask.query.optional.completed,
         microtask.routes.index)
    .post(microtask.body.mandatory.type,
          microtask.body.mandatory.order,
          task.checkers.open,
         microtask.routes.add);

/**
 * Segmentation Routes
 */
app.route("/segmentation")
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        segmentation.routes.index)
    .post(segmentation.body.mandatory.points,
         segmentation.routes.add);
app.route("/segmentation/:segmentationId")
    .get(index.query.optional.populate,
        segmentation.routes.get);

/**
 * Session Routes
 */
app.route("/session")
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        session.routes.index)
    .post(session.routes.add);
app.route("/session/:sessionId")
    .get(index.query.optional.populate,
        session.routes.get)
    .post(session.checkers.open,
        session.routes.complete);
app.route("/session/:sessionId/action")
    .post(session.checkers.open,
         action.body.mandatory.id,
         session.routes.addAction);

/**
 * Action Routes
 */
app.route("/action")
    .get(index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         action.query.optional.type,
         action.query.optional.validity,
         image.query.optional.id,
         tag.query.optional.id,
         action.routes.index)
    .post(image.body.mandatory.id,
         user.body.mandatory.id,
         action.body.mandatory.type,
         action.body.route.add.tag,
         action.routes.add)
    .put(image.body.optional.id,
        tag.body.optional.id,
        action.checkers.routes.bulkValidity,
        action.body.optional.type,
        action.body.mandatory.validity,
        action.routes.bulkValidity);
app.route("/action/:actionId")
    .get(index.query.optional.populate,
        action.routes.get)
    .post(action.checkers.open,
        action.body.route.complete.tag,
        action.body.route.complete.segmentation,
        action.routes.complete)
    .put(action.body.mandatory.validity,
        action.routes.validity);

/**
 * Microtask Routes
 */
app.route("/microtask")
    .get(index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         task.query.optional.id,
         microtask.query.optional.completed,
         microtask.routes.index)
    .post(microtask.body.mandatory.type,
          microtask.body.mandatory.order,
          task.body.mandatory.id,
          microtask.routes.add);
app.route("/microtask/:microtaskId")
    .get(index.query.optional.populate,
          microtask.routes.get)
    .put(microtask.checkers.open,
         action.body.mandatory.id,
         task.checkers.open,
         microtask.routes.complete);

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
