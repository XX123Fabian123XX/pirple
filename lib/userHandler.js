const _data = require("./data");
const helpers = require("./helpers")
const tokenHandler = require("./tokenHandler")

const userHandler = {}

// data: firstName, lastName, phone, password, toAgreement
userHandler.post = (data, callback) => {
    console.log(data.payload)
    if (!data.payload) return callback(400,{"Error":"Invalid data"});
    // check that all required fields are set
    let {firstName, lastName, phone, password, tosAgreement} = data.payload;

    firstName =  typeof(firstName) === "string" && firstName.trim().length > 3  ? firstName.trim() : false
    lastName = typeof(lastName) === "string" && lastName.trim().length > 3   ? lastName.trim() : false
    phone = typeof(phone) === "string" && phone.trim().length == 10   ? phone.trim() : false
    password = typeof(password) === "string" && password.trim().length > 3 ? password.trim() : false
    tosAgreement = typeof(tosAgreement) === "boolean" ? tosAgreement : false

    if (!firstName || !lastName || !phone || !password || !tosAgreement) {
        return callback(400, {'Error': "Missing required fields"})
    } 

    // make sure that the users does not already exist
    _data.read("users",phone, (err) => {
            if (!err) return callback(400, {"Error": "the user already exists"})

            // hash the password
            const hashedPassword = helpers.hashPassword(password);

            if (!hashedPassword) return callback(500, "Error while hashing the password")

            const userObject = {
                firstName,
                lastName,
                phone,
                hashedPassword,
                tosAgreement
            }

            // if the user does not exist, create the user
            _data.create("users", phone, userObject, (err) => {
                if (err) return callback(500, {"Error": "Could not create the user"})
                return callback(201, {"message":"the user has been created successfully"})
            })

            
        })
    }
// @TODO only let an authenticated user access their own object
userHandler.get = (data, callback) => {
    
    const phone = typeof(data.queryStringObject.phone) === "string" && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false

    if (!phone) return callback(400, {"Error": "missing required field phoneNumber"})
    
    tokenHandler.verifyToken(data.headers.token, phone, (isValid) => {
        if (!isValid) return callback(401, {"Error": "Authentication failed"})
        _data.read("users", phone, (err, data) => {
            if (err) return callback(404, {"Error": "The user does not exist"})
            delete data["hashedPassword"]
            return callback(200, {user:data})
        })
    })
}
// required data phone
// optional data -> firstname lastname, password, but one must be specified
// @TODO only let authenticated users update 
userHandler.patch = (data,callback) => {
    // required filed
    const phone = typeof(data.payload.phone) === "string" && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
    
    if (!phone) return callback(400, {"Error": "Please provide a phone number"})

    let {firstName, lastName, password} = data.payload

    // optional field
    firstName =typeof(firstName) === "string" &&  firstName.trim().length > 3  ? firstName.trim() : false
    lastName =  typeof(lastName) === "string" && lastName.trim().length > 3 ? lastName.trim() : false
    password = typeof(password) === "string" &&  password.trim().length > 3  ? password.trim() : false

    if (!firstName && !lastName && !password) return callback(400, {"Error":"You have to specify at least the firstName or the lastName or the password"})

    handlers._tokens.verifyToken(data.headers.token, phone, (isValid) => {
        if (!isValid) return callback(401, {"Error":"Authentication failed"})
  
        _data.read("users", phone, (err, data) => {
            if (err || !data) return callback(404, {"Error": "Could not find the user"})
            
            let newData = {...data}
            
            if (firstName) newData = {...newData, firstName}
            if (lastName) newData = {...newData, lastName}
            if (password) {
                const hashedPassword = helpers.hashPassword(password)
                newData = {...newData, hashedPassword}
            }

            _data.update("users", phone, newData, (err) => {
                if (err) return callback(500, {"Error": "Could not update user"})
                return callback(200, {"message":"user was successfully updated"})
            })
        })
    })
}


userHandler.delete = (data,callback) => {
    let {phone }= data.queryStringObject

    phone  = typeof(data.queryStringObject.phone) === "string" && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false
    
    if (!phone) return callback(400, {"Error": "Please provide a phone number"})
    handlers._tokens.verifyToken(data.headers.token, phone, (isValid) => {
        if (!isValid) return callback(401, {"Error":"Authentication failed"})
        _data.read("users", phone, (err, userData) => {
            if(err ||!userData) return callback(500, {"Error":"could not look up user"})

            _data.delete("users", phone , (err) => {
                if (err) return callback(404, {"Error": "The user may not exist"})

                const userChecks = typeof(userData.checks) === "object" && userData.checks instanceof Array ? userData.checks : []
                let deletionError = false;
                let numberOfDeletions = 0;

                if (userChecks.length == 0) return callback(200)

                userChecks.forEach(check => {
                    _data.delete("checks", check, (err) => {
                        if (err) deletionError = true

                        numberOfDeletions++

                        if (numberOfDeletions === userChecks.length) {
                            if (deletionError) return callback(500, {"Error":`Could not delete all checks. 
                            All checks might not have been deleted successfully from the system`})
                            return callback(200)
                        }
                    }  )
                })

            })
        })
       
    })
}

module.exports = userHandler;