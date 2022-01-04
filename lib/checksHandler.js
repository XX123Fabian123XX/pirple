const _data = require("./data");
const helpers = require("./helpers")
const config =require("./config")
const urlModule = require("url");
const dns = require("dns");


const checksHandler = {}

// required data protocol, url, method, successCodes, timeoutSeconds
checksHandler.post = function(data, callback) {
    // Validate all of these inputs
    let {protocol, url, method, successCodes, timeoutSeconds} = data.payload

    protocol = typeof(protocol) === "string" && ["http", "https"].includes(protocol.trim()) ? protocol.trim() : false
    url = typeof(url) === "string" &&  url.trim().length > 0 ? url.trim() : false
    method = typeof(method) === "string" && ["get", "post", "delete", "put", "patch"].includes(method) ? method : false
    successCodes = typeof(successCodes) === "object" && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false        
    timeoutSeconds = typeof(timeoutSeconds) === "number" && timeoutSeconds % 1 == 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : false

    if(!protocol || !url || !method || !successCodes || !timeoutSeconds) return callback(400, {"Error":"Missing required inputs or inputs are invalid"})

    _data.read("tokens", data.headers.token, function(err, tokenData) {
        if (err || !tokenData) return callback(401, {"Error": "token does not exist"})

        const phone = tokenData.phone

        _data.read("users", phone, function(err, userData) {
            if (err || !userData) return callback(403, {"Error":"Authentication failed"})
        
            const userChecks = typeof(userData.checks) === "object" && userData.checks instanceof Array ? userData.checks : []
            // verify that the user has less than the max number of checks
            if (userChecks.length >= config.maxChecks) return callback(400, {"Error": `You have reached your limit of checks (${config.maxChecks})`})

            // verify that the url given has dns entries and therefore can resolve

            const parsedUrl = urlModule.parse(`${protocol}://${url}`,true);
            const hostname = typeof(parsedUrl.hostname) === "string" && parsedUrl.hostname.length > 0 ? parsedUrl.hostname : false;

            dns.resolve(hostname, function(err, records) {
                if (err || !records) return callback("400", {"Error":"This url does not have a dns entry"})


                const checkId = helpers.createRandomString(20)

                // create the check object and include the user's phone
    
                const checkObject = {
                    id:checkId,
                    userPhone:phone,
                    url,
                    protocol,
                    method,
                    successCodes,
                    timeoutSeconds
                }
    
                // save object to disc
    
                _data.create('checks', checkId, checkObject, (err) => {
                    if (err) return callback(500, {"Error":"Could not save the check object"})
    
                    userData.checks = userChecks
                    userData.checks.push(checkId);
    
                    _data.update('users', userData.phone, userData, (err) => {
                        if (err) return callback(500, {'Error':'Could not update the user'})
                        return callback(200, {data:checkObject})
                    })
                })
            })
        })
    })
}

checksHandler.get = function(data, callback) {   
    let {id} = data.queryStringObject

    id = typeof(id) === "string" && id.trim().length === 20 ? id.trim() : false

    if (!id) return callback(400, {"Error":"Please provide a valid id"})

    // check that the user is authenticated
    checksHandler.validateUser(id, data.headers.token, (isValid) => {
        if (!isValid) return callback(401, {"Error": "You are not authorized to access this check"})

        _data.read("checks", id, (err, checkData) => {
            if (err || !checkData) return callback(400, {"Error": "Could not find check"})
            return callback(200, {data:checkData})
        })
    })
}

checksHandler.delete = function(data, callback) {
    let {id} = data.queryStringObject;

    id = typeof(id) === "string" && id.trim().length === 20 ? id.trim() : false

    if (!id) return callback(400, {"Error":"Please provide a valid id"})

    checksHandler.validateUser(id, data.headers.token, (isValid, userPhone) => {
        if (!isValid) return callback(401, {"Error":"Authentication failed"})

        _data.read("users", userPhone, (err, userData) => {
            if (err || !userData) return callback(500, {"Error":"Could not read user"})

            const indexCheck = userData.checks.findIndex(check => check === id )

            if (indexCheck <= -1) return callback(500, {"Error": "Cannot find check on user"})

            userData.checks.splice(indexCheck,1)

            _data.update("users", userPhone, userData, (err) => {
                if (err) return callback(500, {"Error":"failed to update user"})

                _data.delete("checks", id, (err) => {
                    if (err) return callback(500, {"Error":"failed to delete check"})
                    return callback(204)
                })
            })
        })
    })
}


checksHandler.patch = (data, callback) =>  {
    let {id, protocol, url, method, successCodes, timeoutSeconds} = data.payload

    id = typeof(id) === "string" && id.trim().length === 20 ? id.trim() : false
    protocol = typeof(protocol) === "string" && ["http", "https"].includes(protocol.trim()) ? protocol.trim() : false
    url = typeof(url) === "string" &&  url.trim().length > 0 ? url.trim() : false
    method = typeof(method) === "string" && ["get", "post", "delete", "put", "patch"].includes(method) ? method : false
    successCodes = typeof(successCodes) === "object" && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false        
    timeoutSeconds = typeof(timeoutSeconds) === "number" && timeoutSeconds % 1 == 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : false

    if (!id) return callback(400, {"Error":"Please provide a valid id"})

    if (!protocol && !url && !method && !successCodes && !timeoutSeconds) return callback(400, {"Error": "You have to update at least one field"})
    checksHandler.validateUser(id, data.headers.token, (isValid) => {
        if (!isValid) return callback(401, {"Error": "Authentication failed"})

        _data.read("checks", id, (err, checkData) => {
            if (err || !checkData) return callback(500, {"Error": "Could not access check"})

            if (protocol) checkData.protocol = protocol;
            if (url) checkData.url = url;
            if (method) checkData.method = method;
            if (successCodes) checkData.successCodes = successCodes
            if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds
            _data.update("checks", id, checkData, err => {
                if (err) return callback(500, {"Error":"Could not update check"})
                console.log("successfully updated")
                return callback(200)
            })

        })

    })

}

checksHandler.validateUser = function(checkId, token, callback) {
    if (typeof(token) !== "string" || token.length !== 20) return callback(false)

    token = token.trim()
    checkId = checkId.trim()
    // get the token
    _data.read("tokens", token, (err, tokenData) => {
        if (err || !tokenData) return callback(false)
        _data.read("checks", checkId, (err, checkData) => {
            if (err || !checkData) return callback(false)
            if (checkData.userPhone !== tokenData.phone) return callback(false)
            if (Date.now() > tokenData.expires) return callback(false)
            return callback(true, checkData.userPhone)
        })

    })
}

module.exports = checksHandler;