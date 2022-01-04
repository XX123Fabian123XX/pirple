const http2 = require("http2");
const server = http2.createServer();

// On a stream, send back hello world html

server.on('stream', function(stream, headers) {
    stream.respond({
        'status':200,
        'content-type':'text/html'
    })
    stream.end("<html><body><h1>hello world</h1></body></html>")
})

const port = 6000;

server.listen(port, () => {
    console.log("starting the server on port " + port);
});




