// DEPENDENCIES
const server = require("./lib/server")
const workers = require("./lib/workers")
const cli = require("./lib/cli");

const app = {}

// init function

app.init = (callback) => {
    // start the server
    server.init()
    // start the workers
    workers.init();
    // put it last, so that now logs are omitted
    setTimeout(() => {
        cli.init();
        callback()
    }, 50);
} 


// self invoking only if it is required
if (require.main === module) {
    app.init(() => {});
}

module.exports = app;

