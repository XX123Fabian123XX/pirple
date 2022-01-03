const helpers = require("./helpers")
const userHandler = require("./userHandler");
const tokenHandler = require("./tokenHandler")
const checksHandler = require("./checksHandler");

// DEFINE A REQUEST ROUTER
const handlers = {}

handlers.notFound = (data, callback) => {
    callback(404)
}

// ping handler
handlers.ping = (data, callback) => {
    callback(200);
}

handlers.users = (data, callback) => {
   const acceptableMethods = ["post", "get", "patch", "delete"]
   if (!acceptableMethods.includes(data.method)) return callback(405)
   userHandler[data.method](data, callback)
}


handlers.tokens = (data, callback) => {
    const acceptableMethods = ["post", "get", "patch", "delete"];
    if (!acceptableMethods.includes(data.method)) return callback(404)
    tokenHandler[data.method](data, callback); 
}

handlers.checks = function(data, callback) {
    const allowedMethods = ["patch", "get", "post", "delete"]
    if (!allowedMethods.includes(data.method)) return callback(404)
    checksHandler[data.method](data, callback);
}



// NEW HTML HANDLERS

handlers.index = function(data, callback) {
    if (data.method !== "get") return callback(405, undefined, "html")


    const templateData = {
        'head.title':"Uptime Monitoring - Made simple",
        "head.description":"We offer free, simple uptime monitoring for Http/HTTPs sites ",
        "body.class":"index"
    }

    helpers.getTemplate("index", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })

    })

} 

handlers.sessionCreate = (data, callback) => {
    if (data.method !== "get") return callback(405, undefined, "html")


    const templateData = {
        'head.title':"Login to your account - Made simple",
        "head.description":"Please enter your phone number and password to access your account",
        "body.class":"sessionCreate"
    }

    helpers.getTemplate("sessionCreate", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })
    })
}

handlers.accountEdit = (data,callback) => {
    if (data.method !== "get") return callback(405, undefined, "html")

    const templateData = {
        'head.title':"Account Edit",
        "body.class":"accountEdit"
    }

    helpers.getTemplate("accountEdit", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })
    })
}

handlers.sessionDeleted = (data, callback) => {
    if (data.method !== "get") return callback(405, undefined, "html")


    const templateData = {
        'head.title':"Logged out",
        "head.description":"You have been logged out of your account",
        "body.class":"sessionDeleted"
    }

    helpers.getTemplate("sessionDeleted", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })
    })
}

handlers.accountDeleted = (data, callback) => {
    if (data.method !== "get") return callback(405, undefined, "html")


    const templateData = {
        'head.title':"Account deleted",
        "head.description":"Your account has been deleted",
        "body.class":"accountDeleted"
    }

    helpers.getTemplate("accountDeleted", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })
    })
}



handlers.favicon = (data ,callback) => {
    if (data.method !== "get") return callback(405)

    // read in favicons data
    helpers.getStaticAsset('favicon.ico', (err, data) => {
        if (err || !data) return callback(404)

        callback(200, data, "favicon")
    })

}

handlers.public = (data, callback) => {
    if (data.method !== "get") return callback(405)

    // GET THE FILE NAME
    const trimmedAssetName = data.trimmedPath.replace("public/", "")
    if (trimmedAssetName.length <= 0) return callback(404)

    helpers.getStaticAsset(trimmedAssetName, (err,data) => {
        if (err ||!data) return callback(404)
        let contentType = trimmedAssetName.split(".")[trimmedAssetName.split(".").length - 1]
        if (contentType === "ico") contentType = "favicon"

        if (["js", "css", "favicon", "png", "jpg"].includes(contentType) === false) contentType = "plain"

        callback(200, data, contentType)

    })
}

handlers.accountCreate = function(data, callback) {
    if (data.method !== "get") return callback(405, undefined, "html")


    const templateData = {
        'head.title':"Create an Account",
        "head.description":"signup is easy it only takes a few seconds",
        "body.class":"accountCreate"
    }

    helpers.getTemplate("accountCreate", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })
    })
}

handlers.checksCreate = (data, callback) => {
    if (data.method !== "get") return callback(405, undefined, "html")


    const templateData = {
        'head.title':"Create an Account",
        "head.description":"signup is easy it only takes a few seconds",
        "body.class":"checksCreate"
    }

    helpers.getTemplate("checksCreate", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })
    }) 
}


handlers.checksList = (data, callback) => {
    if (data.method !== "get") return callback(405, undefined, "html")


    const templateData = {
        'head.title':"See all of your checks",
        "body.class":"checksList"
    }

    helpers.getTemplate("checksList", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })
    }) 
}

handlers.checkEdit = (data, callback) => {
    if (data.method !== "get") return callback(405, undefined, "html")


    const templateData = {
        'head.title':"Update a check",
        "body.class":"checksEdit"
    }

    helpers.getTemplate("checksEdit", templateData, (err, str) => {
        if (err || !str) return callback(500, undefined, "html" )
        helpers.addUniversalHeaders(str, templateData, (err, str) => {
            if (err || !str) return callback(500, undefined, "html")
            return callback(200, str, "html")
        })
    }) 
}


handlers.exampleError = function(data, callback) {
    const error = new Error('This is an example error')
    throw(error);
}









module.exports = handlers;

