const _data = require("./data");
const helpers = require("./helpers")


const tokenHandler = {}

// required data is phone and password
tokenHandler.post = function(data, callback) {  

    let {phone, password} = data.payload

    phone = typeof(phone) === "string" && phone.trim().length == 10   ? phone.trim() : false
    password = typeof(password) === "string" &&  password.trim().length > 3  ? password.trim() : false

    if (!phone || !password) return callback(400, {"Error":"Please provide the phone number and the password"})

    // lookup user that matches phone number

    _data.read("users", phone, (err, data) => {
        if (err) return callback(400, {"Error":"Could not find the specified user"})

        // validate the password
        if (helpers.hashPassword(password) != data.hashedPassword) return callback(401, {"Error": "The passwords do not match"})

        // create a new token with a valid name
        const tokenId = helpers.createRandomString(20);

        const expires = Date.now() + 1000 * 60 * 60;

        const tokenObject = {
            "id":tokenId,
            phone,
            expires
        }

        _data.create("tokens", tokenId, tokenObject, (err) => {
            if (err) return callback(500, {"Error":"Could not save the token"})
            return callback(200, {"token":tokenObject})
        })
    })


}


tokenHandler.delete = function(data, callback) {
    let {id} = data.queryStringObject;

    id = typeof(id) === "string" && id.trim().length == 20 ? id.trim() : false
    
    if (!id) return callback(400, {"Error":"Please provide a valid id number"})

    _data.delete("tokens", id, (err) => {
        if (err) return callback(400, {"Error":"Could not delete the token. The token may not exist"})
        return callback(204)
    })
}


tokenHandler.patch = function(data, callback) {
    let {id, extend} = data.payload;

    id = typeof(id) === "string" && id.trim().length === 20 ? id.trim() : false
    extend = typeof(extend) === "boolean" ? extend : false

    if (!id || !extend) return callback(400, {"Error":"Please provide a valid id and extend has to be true"})

    _data.read("tokens", id, (err,data) => {
        if (err || !data) return callback(404, {"Error": "could not find the user"})

        // check if the token has not already expired

        if (Date.now() > data.expires) return callback(400, {"Error": "The token has already expired. You cannot extend it"})

        data.expires = Date.now() + 1000 * 60 * 60;

        _data.update("tokens", id, data, (err) => {
            if (err) return callback(500, {"Error": "Could not update the token"})
            return callback(200, {"message":"successfully extended the token"})
        })
    })
}

tokenHandler.get = function(data, callback) {
    let {id} = data.queryStringObject;

    id = typeof(id) === "string" && id.trim().length == 20 ? id.trim() : false

    if (!id) return callback(400, {"Error":"Please provide a valid id"})

    _data.read("tokens", id, (err, data) => {
        if (err) return callback(400, {"Error":"Could not find the token"})
        return callback(200, {"token":data})
    })
}


tokenHandler.verifyToken = function(id, phone, callback) {
    if (typeof(id) !== "string" || id.trim().length !== 20) return callback(false);
    if (typeof(phone) !== "string" || phone.trim().length !== 10) return callback(false);
    phone = phone.trim()
    id = id.trim();

    _data.read("tokens", id, (err, data) => {
        if (err) return callback(false)
        // check that the phone number matches
        if (data.phone !== phone) return callback(false)
        if (Date.now() > data.expires) return callback(false)
        return callback(true)
    })
}

module.exports = tokenHandler;