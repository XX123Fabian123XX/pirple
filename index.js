// DEPENDENCIES
const server = require("./lib/server")
const workers = require("./lib/workers")
const cli = require("./lib/cli");

const app = {}

// init function

app.init = () => {
    // start the server
    server.init()
    // start the workers
    workers.init();
    // put it last, so that now logs are omitted
    setTimeout(() => {
        cli.init();
    }, 50);
} 

app.init();

module.exports = app;

