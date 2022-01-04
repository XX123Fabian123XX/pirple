// example http2 client

const http2 = require("http2");

// create a client
const client = http2.connect("http://localhost:6000");

// create a request
const req = client.request({
    ':path':"/",

})

// when a message is received, add the pieces together until you reach
let str = ""
req.on('data', function(chunk) {
    str+= chunk;
})

req.on('end', function() {
    console.log(str)
})

req.end();
