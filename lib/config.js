// EXPORT CONFIGURATION VARIABLES
// CONTAINER FOR ALL OF THE ENVIRONMENTS
var environments = {};

// staging (default) environment
environments.staging = {
    'port':3000,
    'envName':'staging',
    'hashingSecret':"thisIsASecret",
    "maxChecks":30,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
      },
    'timeForCheckCycleInMilliseconds': 1000,
    'timeForLogRotationInMilliseconds': 1000 * 60 * 5,
    'templateGlobals': {
        "appName":"UpTimeChecker",
        "companyName":"NotARealCompany Inc",
        "baseUrl":"http://localhost:3000/",
        "yearCreated":2020
    }
}

environments.production = {
    'port':5000,
    'envName':'production',
    'hashingSecret':"thisIsASecret",
    "maxChecks":5,
    'timeForCheckCycleInMilliseconds': 1000 * 60,
    'timeForLogRotationInMilliseconds': 1000 * 60 * 5
}

environments.testing = {
    'port':4000,
    'envName':'testing',
    'hashingSecret':"thisIsASecret",
    "maxChecks":30,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
      },
    'timeForCheckCycleInMilliseconds': 1000,
    'timeForLogRotationInMilliseconds': 1000 * 60 * 5,
    'templateGlobals': {
        "appName":"UpTimeChecker",
        "companyName":"NotARealCompany Inc",
        "baseUrl":"http://localhost:3000/",
        "yearCreated":2020
    }
}

// determine which environment should be passed
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase().trim() : 'staging'
// check that the current environment is a key

module.exports =  environments[currentEnvironment] ?? environments.staging;