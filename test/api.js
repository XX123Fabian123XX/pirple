/// test the api
const app = require("../index");
const assert = require("assert");
const http = require("http");
const config = require("./../lib/config");

// HOLDER FOR THE TEST
const api = {};

const helpers = {}
helpers.makeGetRequest = function(path, callback) {
    // configure the request details
    const requestDetails = {
        'protocol':"http:",
        'hostname':"localhost",
        'port':config.port,
        'method':"GET",
        path,
        headers: {
            'Content-Type':'application/json'
        }
    }


    const req = http.request(requestDetails, function(res) {
        callback(res);
    })

    req.end();
};

// The main init() function shuold be able to run without throwing

api["app.init should start without throwing"] = function(done) {
    assert.doesNotThrow(function() {
        app.init(() => {
            done();
        });
    }, TypeError)
}

// make a request to ping
api['/ping should respond to get with 200'] = function(done) {
    helpers.makeGetRequest('/ping', function(res) {
        assert.equal(res.statusCode, 200);
        done();
    })
}

api['/api/users should respond to GET with a 400'] = function(done) {
    helpers.makeGetRequest("/api/users", function(res) {
        assert.equal(res.statusCode, 400);
        done();
    })
}


api['A random path should respond with 404'] = function(done) {
    helpers.makeGetRequest("/this/path/shoud/not/exist", function(res) {
        assert.equal(res.statusCode, 404);
        done();
    })
}











// export the tests to the runner
module.exports = api;




