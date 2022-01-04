// DEPENDENCIES
const server = require("./lib/server")
const workers = require("./lib/workers")
const cli = require("./lib/cli");
const cluster = require("cluster");
const os = require("os");

const app = {}

// init function

app.init = (callback) => {
    
    if (cluster.isMaster) {
        // start the workers
        workers.init();
        // put it last, so that now logs are omitted
        setTimeout(() => {
            cli.init();
            callback()
        }, 50);

        // fork the process
        for(let i = 0; i < os.cpus().length; i++) {
            cluster.fork();
        }
    } else {
        // if we are not on the masters thread
        // start the server
        server.init()
    }
   

    
  

} 


// self invoking only if it is required
if (require.main === module) {
    app.init(() => {});
}

module.exports = app;

