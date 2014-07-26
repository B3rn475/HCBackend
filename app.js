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
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false, limit: '5mb' }));
// parse application/json
app.use(bodyParser.json({limit: '5mb'}));
// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
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

var session = require("./routes/session.js");
app.param("sessionId", session.params.id);

var action = require("./routes/action.js");
app.param("actionId", action.params.id);

var microtask = require("./routes/microtask.js");
app.param("microtaskId", microtask.params.id);

var choose = require("./routes/choose.js");

/**
 * Image Routes
 */
app.route("/image")
    .post(image.body.optional.payload,
          image.body.optional.url,
          image.body.optional.pose,
          image.checkers.route.add,
          image.routes.add)
    .get(index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         image.routes.index);
app.route("/image/count")
    .get(image.routes.count);
app.route("/image/:imageId")
    .get(index.query.optional.populate,
         image.routes.get)
    .put(image.body.mandatory.pose,
         image.routes.update);
app.route("/image/:imageId/tag")
    .get(index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         image.routes.tag);

/**
 * Collection Routes
 */
app.route("/collection")
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        collection.routes.index)
    .post(collection.body.route.add.name,
          collection.body.route.add.exist,
          collection.routes.add);
app.route("/collection/count")
    .get(collection.routes.count);
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
          user.body.route.add.exist,
          user.routes.add)
    .get(index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         index.query.optional.populate,
         user.query.optional.app_id,
         user.routes.index);
app.route("/user/count")
    .get(user.query.optional.app_id,
         user.routes.count);
app.route("/user/:userId")
    .get(index.query.optional.populate,
         user.routes.get)
    .put(user.body.mandatory.quality,
         user.routes.update);

/**
 * Tag Routes
 */

app.route("/tag")
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        tag.routes.index)
    .post(tag.body.route.add.name,
          tag.body.route.add.exist,
          tag.routes.add);
app.route("/tag/count")
    .get(tag.routes.count);
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
        image.query.optional.id,
        tag.query.optional.id,
        mask.routes.index)
    .post(image.body.mandatory.id,
         tag.body.mandatory.id,
         mask.body.mandatory.payload,
         mask.body.mandatory.quality,
         mask.body.mandatory.segmentations,
         mask.routes.add);
app.route("/mask/count")
    .get(image.query.optional.id,
         tag.query.optional.id,
         mask.routes.count);
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
app.route("/task/count")
    .get(image.query.optional.id,
         collection.query.optional.id,
         task.checkers.route.index,
         task.query.optional.completed,
         task.routes.count);
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
 * Session Routes
 */
app.route("/session")
    .get(index.query.optional.count,
        index.query.optional.since_id,
        index.query.optional.max_id,
        session.query.optional.completed,
        session.routes.index)
    .post(index.body.optional.created_at,
          session.routes.add);
app.route("/session/count")
    .get(session.query.optional.completed,
         session.routes.count);
app.route("/session/:sessionId")
    .get(index.query.optional.populate,
         session.routes.get)
    .post(session.checkers.open,
          index.body.optional.completed_at,
          session.routes.complete);
app.route("/session/:sessionId/action")
    .get(index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         action.query.optional.type,
         action.query.optional.validity,
         action.query.optional.completed,
         image.query.optional.id,
         tag.query.optional.id,
         action.routes.index)
    .post(session.checkers.open,
          image.body.mandatory.id,
          user.body.mandatory.id,
          action.body.mandatory.type,
          action.body.route.add.tag,
          action.body.route.add.points,
          action.routes.add)
    .put(image.query.optional.id,
         tag.query.optional.id,
         action.query.optional.type,
         action.query.optional.completed,
         action.body.mandatory.validity,
         action.routes.validity);

/**
 * Action Routes
 */
app.route("/action")
    .get(index.query.optional.populate,
         index.query.optional.count,
         index.query.optional.since_id,
         index.query.optional.max_id,
         action.query.optional.type,
         action.query.optional.validity,
         action.query.optional.completed,
         image.query.optional.id,
         tag.query.optional.id,
         session.query.optional.id,
         action.routes.index)
    .post(session.body.mandatory.id,
          session.checkers.open,
          image.body.mandatory.id,
          user.body.mandatory.id,
          action.body.mandatory.type,
          action.body.route.add.tag,
          action.body.route.add.points,
          action.body.route.add.history,
          index.body.optional.created_at,
          index.body.optional.completed_at,
          action.checkers.route.add,
          action.routes.add)
    .put(image.query.optional.id,
        tag.query.optional.id,
        session.query.optional.id,
        action.checkers.route.validity,
        action.query.optional.type,
        action.query.optional.completed,
        action.body.mandatory.validity,
        action.routes.validity);
app.route("/action/count")
    .get(action.query.optional.type,
         action.query.optional.validity,
         action.query.optional.completed,
         image.query.optional.id,
         tag.query.optional.id,
         session.query.optional.id,
         action.routes.count);
app.route("/action/:actionId")
    .get(index.query.optional.populate,
         action.routes.get)
    .post(action.checkers.open,
          action.body.route.complete.tag,
          action.body.route.complete.points,
          action.body.route.complete.history,
          action.checkers.route.complete,
          action.routes.complete)
    .put(action.checkers.completed,
         action.body.route.update.validity,
         action.body.route.update.quality,
         action.checkers.route.update,
         action.routes.update);

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
app.route("/microtask/count")
    .get(task.query.optional.id,
         microtask.query.optional.completed,
         microtask.routes.count);
app.route("/microtask/:microtaskId")
    .get(index.query.optional.populate,
          microtask.routes.get)
    .post(microtask.checkers.open,
         action.body.mandatory.id,
         microtask.routes.complete);

/**
 * Choose Routes
 */
app.route("/choose")
    .get(choose.routes.list);
app.route("/choose/random")
    .get(collection.query.optional.id,
         choose.query.optional.limit,
         choose.routes.random);
app.route("/choose/leastused")
    .get(collection.query.optional.id,
         choose.query.optional.limit,
         choose.routes.leastused);

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
    app.use(index.errorHandler({ dumpExceptions: true, showStack: true }));
} else if ('production' === env) {
    app.use(index.errorHandler());
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
