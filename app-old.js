const express = require('express');
const swagger = require('swagger-express-middleware');
const debug = require("debug")("app");
var app = express();

swagger('api/feeder.yaml', app, function(err, middleware) {
    // Add all the Swagger Express Middleware, or just the ones you need.
    // NOTE: Some of these accept optional options (omitted here for brevity)
    app.use(
        middleware.metadata(),
        middleware.CORS(),
        middleware.files(),
        middleware.parseRequest(),
        middleware.validateRequest(),
        middleware.mock()
    );

    let router = require('./api')(app);

    // Basic error Handling
    app.use(function(err, req, res, next) {
        debug("Error ", err);
        res.status(err.status || 500);
    });

    app.listen(8000, function() {
        console.log('Now running at http://localhost:8000');
    });
});