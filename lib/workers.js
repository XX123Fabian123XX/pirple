/*
worker related tasks
*/

// DEPENDENCIES
const config = require("./config");
const _data = require("./data")
const http = require("http");
const https = require("https")
const helpers = require("./helpers");
const url = require("url");
const _logs = require("./logs")
const util = require("util")
const debug = util.debuglog("workers");

const workers = {}

workers.loop = function() {
    setInterval((function() {
        workers.gatherAllChecks()
    }), config.timeForCheckCycleInMilliseconds)
}

// function to rotate all of the logs
workers.rotateLogs = function() {
    // list all of the non compressed log files
    _logs.list(false, function(err, logs) {
        if (err || !logs || logs.length <= 0) return debug("Did not find any logs")

        logs.forEach(log => {
            const logId = log.replace('.log', '');

            const newFileId = logId + "-" + Date.now();

            _logs.compress(logId, newFileId, (err) => {
                if (err) return debug("Error compressing the file")
                // truncate the original file
                _logs.truncate(logId, function(err) {
                    if (err) return debug("Error truncating the file")
                    debug("success truncating the file")
                })
            })
        })

    })
}
workers.logRotationLoop = () => {
    setInterval(function() {
        workers.rotateLogs()
    }, config.timeForLogRotationInMilliseconds)
}


workers.init = () => {

    console.log('\x1b[31m%s\x1b[0m', 'Background workers are running')

    // Execute all of the checks
    workers.gatherAllChecks();

    // call a loop so that the checks continue on their own
    workers.loop();

    workers.rotateLogs();

    workers.logRotationLoop();
}

workers.gatherAllChecks = function() {
    _data.list("checks", (err, files) => {
        if (err || typeof(files) !== "object" || !files instanceof Array || files.length <= 0 ) return debug("Error could not find any checks to process")
        
        files.forEach(file => {
            _data.read("checks", file, (err, originalCheckData) => {
                if (err || !originalCheckData) return debug(`Error while accessing this check ${file}`) 
                    workers.validateCheckData(originalCheckData)
            })
        })
    })
}

workers.validateCheckData = (originalCheckData) => {
    originalCheckData = typeof(originalCheckData) === "object" && originalCheckData != null ? originalCheckData :false
    if (!originalCheckData) return debug("The object is invalid");

    originalCheckData.id =typeof(originalCheckData.id) === "string" && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : false
    originalCheckData.userPhone =typeof(originalCheckData.userPhone) === "string" && originalCheckData.userPhone.trim().length === 10 ? originalCheckData.userPhone.trim() : false
    originalCheckData.protocol =typeof(originalCheckData.protocol) === "string" && ["http", "https"].includes(originalCheckData.protocol) ? originalCheckData.protocol : false
    originalCheckData.url =typeof(originalCheckData.url) === "string" && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false
    originalCheckData.method =typeof(originalCheckData.method) === "string" && ["post", "get", "delete", "put", "patch"].includes(originalCheckData.method) ? originalCheckData.method : false
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) === "object" && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) === "number" && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false

    // set the keys if the check has never seen this function

    originalCheckData.state =typeof(originalCheckData.state) === "string" && ["up", "down"].includes(originalCheckData.state) ? originalCheckData.state : "down"
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) === "number" && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // if all of the tests passed -> pass the data on to the actual checking function
    if (!originalCheckData.id || 
        !originalCheckData.userPhone ||
        !originalCheckData.protocol ||
        !originalCheckData.url ||
        !originalCheckData.method ||
        !originalCheckData.successCodes ||
        !originalCheckData.timeoutSeconds
        ) return debug("One of the checks is not properly formatted")

    workers.performCheck(originalCheckData);
} 

workers.performCheck = (originalCheckData) => {
    // prepare the initial check outcome
    const checkOutcome = {
        'error': false,
        'responseCode': false 
    }

    let outcomeSent = false;
    
    const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`)    
    const hostName = parsedUrl.hostname;
    const path = parsedUrl.path

    const requestDetails = {
        'protocol': originalCheckData.protocol + ":",
        'hostname': hostName,
        'method': originalCheckData.method.toUpperCase(),
        'path':path,
        'timeout': originalCheckData.timeoutSeconds * 1000
    }

    const module_to_use = originalCheckData.protocol == "http" ? http : https;

    const request = module_to_use.request(requestDetails, function(res) {
        const status = res.statusCode;

        // update the checkoutcome
        checkOutcome.responseCode = status;

        if (!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true;
        }
    })

    // bind to the error
    request.on('error', function(e) {
        // update the checkoutcome
        checkOutcome.error = {
            'error':true,
            'value':e
        }
        if (!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true;
        }
    })

    // bind to the timeout event
    request.on('timeout', function(e) {
        // update the checkoutcome
        checkOutcome.error = {
            'error':true,
            'value':'timeout'
        }
        if (!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true;
        }
    })

    request.end();
}

// process the checkoutcome, update the check data
// special data for a check that has never been tested before
workers.processCheckOutcome = (originCheckData, checkOutcome) => {
    // DECIDE IF THE CHECK IS CONSIDERED UP OR DOWN
    const state = !checkOutcome.error && checkOutcome.responseCode && originCheckData.successCodes.includes(checkOutcome.responseCode) ? "up" : "down"

    const alertWarrented = originCheckData.lastChecked && originCheckData.state !== state ? true : false;

    // log the outcome
    const timeOfCheck = Date.now();
    workers.log(originCheckData,checkOutcome, state, alertWarrented, timeOfCheck)

    // update the check data
    const newCheckData = originCheckData;

    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    _data.update("checks",newCheckData.id, newCheckData, (err) => {
        if (err) return debug("Error trying to update the check data")
        if (alertWarrented) return workers.alertUserToStatusChange(newCheckData)
        debug("NO alert necessary, nothing has changed")
    });
}

workers.alertUserToStatusChange = (newCheckData) => {
    const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state} `
    helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err) {
        if (err) return debug(`This error occured while trying to send a message to the user ${err}`)
        return debug(`Successfully sent message to user. Message is ${msg}`)
    } )
}

workers.log = function(originalCheckData,checkOutcome, state, alertWarrented, timeOfCheck) {
    // form the log data
    const logData = {
        'check':originalCheckData,
        'outcome':checkOutcome,
        'state':state,
        'alert':alertWarrented,
        'time':timeOfCheck
    }

    const logString = JSON.stringify(logData);

    // DETERMINE THE NAME OF THE LOG FILE
    const logFileName = originalCheckData.id;

    // append the log string to the file
    _logs.append(logFileName, logString, function(err) {
        if (err) debug(`Logging to file failed with err ${err}`)
        debug("Logging to file succeeded")
    })




}



module.exports = workers;





