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
var app = express();

// Configuration

var env = process.env.NODE_ENV || 'development';

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser());
app.use(methodOverride());

// Routes
var index = require("./routes");
var image = require("./routes/image.js");
var task = require("./routes/task.js");
var session = require("./routes/session.js");
var mask = require("./routes/mask.js");
var tag = require("./routes/tag.js");
var action = require("./routes/action.js");
var segmentation = require("./routes/segmentation.js");

app.get("/", index.index);
app.get("/image", image.index);
app.get("/task", task.index);
app.get("/session", session.index);
app.get("/mask", mask.index);
app.get("/tag", tag.index);
app.get("/action", action.index);
app.get("/segmentation", segmentation.index);

// Static Files

app.use(express.static(__dirname + '/public'));


// Error Handling

app.use(index.invalidRoute);

if ('development' === env) {
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
} else if ('production' === env) {
    app.use(errorHandler());
} else {
    console.log(clc.red("Unknown environment: ") + env);
    process.exit(1);
}

var port = process.env.port || 3000;

app.listen(port, function () {
    console.log(clc.green("Express server listening on port ") + "%d" + clc.green(" in ") + "%s" + clc.green(" mode"), port, app.settings.env);
});
