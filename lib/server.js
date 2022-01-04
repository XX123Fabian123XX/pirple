
// server related tasks
const http = require("http");
const url = require("url");
const {StringDecoder} = require("string_decoder");
const environment = require("./config")
const handlers = require("./handlers");
const helpers = require("./helpers")
const util = require("util");
const debug = util.debug("server")

// instantiate server object
const server = {}

server.httpServer = http.createServer((req,res) => {

    // GET THE URL AND PARSE IT
    const parsedUrl = url.parse(req.url, true);
    // GET THE PATH FROM THE URL
    const path = parsedUrl.pathname;
    
    // trim the path
    const trimmedPath = path.replace(/^\/+|\/+$/g, "")

    // GET THE HTTP METHOD
    const method = req.method.toLowerCase(); 

    // GET THE QUERY STRING AS AN OBJECT
    const queryString = parsedUrl.query;

    // GET THE HEADERS
    const headers = req.headers;

    // GET THE PAYLOAD
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    })

    req.on('end', () => {
        buffer += decoder.end();
        
        // choose the correct handler
        
        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // if the request is within the public directory is that handler instead
        if (trimmedPath.startsWith("public/")) chosenHandler = server.router['public'];

        // construct the dataobject to send to the handler
        var data = {
            trimmedPath,
            queryStringObject: queryString,
            method,
            headers,
            payload:helpers.parseToJson(buffer),
        }

        // route the request to the handler specified in the router
        try {
            chosenHandler(data, function(statusCode, payload, contentType) {
                server.processResponse(res, data.method, statusCode, contentType, payload, trimmedPath)
            })
        } catch(err) {
            debug(err);
            server.processResponse(res, method, trimmedPath, 500, {'Error': 'An Unknown error has occured'},'json');
        }

       
        // LOG THE REQUEST
        
    })
    
})

server.init = () => {
    // start the http server
    server.httpServer.listen(environment.port, () => {
        console.log('\x1b[36m%s\x1b[0m', `RUNNING ON PORT ${environment.port} in environment ${environment.envName}`)
    })
}

server.router  = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted':handlers.sessionDeleted,
    'checks/all' : handlers.checksList,
    'checks/create':handlers.checksCreate,
    'checks/edit': handlers.checkEdit, 
    'ping': handlers.ping,
    'api/users': handlers.users,
    "api/tokens": handlers.tokens,
    "api/checks": handlers.checks,
    "favicon.ico" : handlers.favicon,
    "public": handlers.public,
    "examples/error" : handlers.exampleError
}

server.processResponse = (res, method, statusCode, contentType, payload, trimmedPath) => {
    // determine the type of response (fallack to json)
    contentType = typeof(contentType) === "string" ? contentType : "json"
    // use the status or efault to 200
    statusCode = typeof(statusCode) === "number" ? statusCode : 200;
    // use the payload or default to {}

    let payloadString = ''
    if (contentType === "json") {
        payload = typeof(payload) === "object" ? payload : {}
        payloadString = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json");
    }

    if (contentType === "html") {
        payloadString = typeof(payload) === "string" ? payload : ""
        res.setHeader("Content-Type", "text/html")
    }

    if (contentType === "css") {
        payloadString = typeof(payload) !== "undefined" ? payload : ""
        res.setHeader("Content-Type", "text/css")
    }

    if (contentType === "js") {
        payloadString = typeof(payload) !== "undefined" ? payload : ""
        res.setHeader("Content-Type", "text/javascript")
    }

    if (contentType == "png") {
        payloadString = typeof(payload) !== "undefined" ? payload : ""
        res.setHeader("Content-Type", "image/png")
    }

    if (contentType === "jpg") {
        payloadString = typeof(payload) !== "undefined" ? payload : ""
        res.setHeader("Content-Type", "image/jpg") 
    }

    if (contentType === "favicon") {
        payloadString = typeof(payload) !== "undefined" ? payload : ""
        res.setHeader("Content-Type", "image/x-icon") 
    }

    if (contentType === "plain") {
        payloadString = typeof(payload) === "string" ? payload : ""
        res.setHeader("Content-Type", "text/plain") 
    }

    // common to all of the requests
    res.writeHead(statusCode);
    res.end(payloadString);

    if (statusCode === 200) return debug('\x1b[32m%s\x1b[0m', `${method.toUpperCase()}/${trimmedPath} ${statusCode}`)

    debug('\x1b[31m%s\x1b[0m', `${method.toUpperCase()}/${trimmedPath} ${statusCode}`);
}



module.exports = server;
