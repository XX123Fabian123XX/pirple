// library for storing and rotating logs
const fs = require("fs");
const path = require("path");
const zlib =  require("zlib");
const lib = require("./data");

// container for the module
const logs = {}

logs.baseDir = path.join(__dirname, "./../.logs")

// append a string to a file, create the file if it does not exist
logs.append = function(file,str, callback) {
    // open the file for appending

    fs.open(path.join(logs.baseDir, `${file}.log`), 'a', (err, fileDescriptor) => {
        if (err || !fileDescriptor) return callback("Could not open file for appending");
        
        fs.appendFile(fileDescriptor, str+="\n", function(err) {
            if (err) return callback("Error appending to file")
            fs.close(fileDescriptor, (err) => {
                if (err) return callback("Error closing the file that was being appended")
                return callback(false)
            })
        })
    })
}

logs.list = (includeCompressedLogs, callback) => {
    fs.readdir(path.join(logs.baseDir), (err, files) => {
        if (err || !files || files.length <= 0) return callback("No files have been found")

        const trimmedFileNames = []

        files.forEach(file => {
            if (file.endsWith(".log")) {
                trimmedFileNames.push(file.replace(".log", ''))
            }
            // add on the .gz files
            if (file.endsWith(".gz.b64") && includeCompressedLogs) {
                trimmedFileNames.push(file.replace(".gz.b64", ''))
            }
        })
        return callback(false, trimmedFileNames)
    })
}

logs.compress = function(logId, newFileId, callback) {
    const sourceFile = `${logId}.log`
    const destinationFile = `${newFileId}.gz.b64`

    // read the source file

    fs.readFile(path.join(logs.baseDir, sourceFile), 'utf8', function(err, data) {
        if (err || !data) return callback("Error while reading log file")

        zlib.gzip(data, function(err, buffer) {
            if (err || !buffer) return callback(err)
            fs.open(path.join(logs.baseDir, destinationFile), "wx", function(err, fileDescriptor) {
                if (err || !fileDescriptor) return callback(err)
                
                fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err) {
                    if (err) return callback(err)
                    fs.close(fileDescriptor, (err) => {
                        if (err) return callback(err)
                        return callback(false)
                    })
                })
            })
        })
    })
}

// DECOMPRESS THE CONTENTS OF a .gz-b64 file into a string variable
logs.decompress = function(fileId, callback) {
    const fileName = `${fileId}.gz.b64`

    fs.readFile(path.join(logs.baseDir, fileName), 'utf8', (err, data) => {
        if (err ||!data) return callback(err)

        // decompress
        const inputBuffer = Buffer.from(data, 'base64');

        zlib.unzip(inputBuffer, function(err, outputBuffer) {
            if (err || !outputBuffer) return callback(err)

            const str = outputBuffer.toString()
            return callback(false, str)
        })
    })
}

logs.truncate = function(logId, callback) {
    fs.truncate(path.join(logs.baseDir, `${logId}.log`), 0, function(err) {
        if (err) return callback(err)
        return callback(false)
    })
}

logs.read = (logId, callback) => {
    // check if the file is compressed or not
    fs.access(path.join(logs.baseDir, `${logId}.gz.b64`),fs.F_OK, (err) => {
        if (!err) {
            logs.decompress(logId, (err, content) => {
                if (err) return callback("Error while decompressing the file")
                return callback(null, content);
            })
        }

        // // read as normal log file
        fs.readFile(path.join(logs.baseDir, `${logId}.log`),"utf8", (err,content) => {
            if (err) return callback("Error while reading the log file")
            return callback(null, content);
        })
    })
}

module.exports = logs;




