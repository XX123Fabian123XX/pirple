/*
 Helpers for various tasks
*/

const crypto = require("crypto");
const config = require("./config")
const https = require("https");
const queryString = require("querystring")
const fs = require("fs");
const path = require("path");
// container for helpers

const helpers = {

}

// create a random string of a given length
helpers.createRandomString = (length) => {
    if (typeof(length) !== "number" || length <= 0) return false

    // define all of the possible characters
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890'
    
    let randomString = ""

    for(let counter = 0; counter < length; counter++) {
        
        randomString += possibleCharacters[Math.floor(Math.random() * possibleCharacters.length)]

    }
    
    return randomString;
}

helpers.hashPassword = (password) => {
    if (!typeof(password) === "string" ||  !password.length > 0) return false

    return crypto.createHmac('sha256', config.hashingSecret).update(password).digest("hex")
}

helpers.parseToJson = (buffer) => {
    try {
        return JSON.parse(buffer);
    } catch(err) {
        return false;   
    }
}


helpers.sendTwilioSms = function(phone, message, callback) {
    phone = typeof(phone) === "string" && phone.trim().length === 10 ? phone.trim() : false
    message = typeof(message) === "string" && message.trim().length > 0 && message.trim().length <= 1600 ? message.trim() : false

    if (!phone || !message) return callback('Given paramters were missing or invalid')

    // configure the request payload

    const payload = {
        'From': config.twilio.fromPhone,
        'To':'1' + phone,
        'Body':message,
    }

    const stringPayload = queryString.stringify(payload)
    const requestDetails = {
        'protocol':"https:",
        'hostname': 'api.twilio.com',
        'method':'post',
        'path':'/2010-04-01/Accounts/' + config.twilio.accountSid+'/Messages.json',
        'auth':config.twilio.accountSid+":"+config.twilio.authToken,
        'headers': {
            'Content-Type':'application/x-www-form-urlencoded',
            'Content-Length':Buffer.byteLength(stringPayload)
        }
    }

    const req = https.request(requestDetails, function(res) {
        // Grab the status of the send request
        const status =res.statusCode
        // call back
        if (status === 200 || status === 201) return callback(false)
        return callback(`Status code returned was ` + status)
    })

    req.on('error', (err) => {
        return callback(err)
    })

    // ADD the payload
    req.write(stringPayload)

    // end the request
    req.end() 


}

helpers.getTemplate = function(templateName, data, callback) {
    templateName = typeof(templateName) === "string" && templateName.length > 0 ? templateName : false
    data = typeof(data) === "object" && data !== null ? data : {};
    if (!templateName) return callback("A valid template Name was not specified")

    const templatePath = path.join(__dirname, "../templates/");
    fs.readFile(path.join(templatePath, `${templateName}.html`), "utf-8", (err, templateContent) => {
        if (err || !templateContent || templateContent.length <= 0) return callback("No template was found")
        
        return callback(false, helpers.interpolate(templateContent, data))
    })
} 

// ADD FOOTER AND HEADER
helpers.addUniversalHeaders = function(str, data, callback) {
    str = typeof(str) === "string" && str.length > 0 ? str : ''
    data = typeof(data) === "object" && data !== null ? data : {}

    helpers.getTemplate('_header', data, (err, headerString) => {
        if (err || !headerString) return callback("Error while reading the header")

        helpers.getTemplate('_footer', data, (err, footerString) => {
            if (err ||!footerString) return callback("Erorr while reading the footer")

            return callback(false, `${headerString} \n ${str} \n ${footerString}` )
        })
    })
}

// TAKE A GIVEN STRING AND  REPLACE ALL KEYS WITHIN IT
helpers.interpolate = function(str, data) {
    str === typeof(str) === "string" && str.length > 0 ? str : false
    data === typeof(object) && Object.keys(data).length > 0 ? object : false

    if (!str || !data) return ''


    for(const [key,value] of Object.entries(config.templateGlobals)) {
        data[`global.${key}`] = value;
    }
    for (const [key,value] of Object.entries(data)) {
        str = str.replace(`{${key}}`, value)
    }
    return str;
}

helpers.getStaticAsset = (filename, callback) => {
    filename = typeof(filename) === "string" && filename.length > 0 ? filename : false

    if (!filename) return callback("The filename is invalid")
    const publicDirectory = path.join(__dirname, "./../public");
    fs.readFile(path.join(publicDirectory, filename), (err, data) => {
        if (err ||!data) return callback("Error while reading the file")
        return callback(false, data)
    })
}   

helpers.getANumber = function() {
    return 1;
}


module.exports = helpers;
