// library for storing and editing data

// dependencies the filesystem
const fs = require("fs");
const path = require("path");
const helpers =require("./helpers")

// container for exporting this module
const lib = {}

lib.baseDir = path.join(__dirname, "../.data");

// write data to a flie
lib.create = (dir, file, data, callback) => {
    // open the file for writing)
    const filepath = path.join(lib.baseDir, dir, `${file}.json`)
    fs.open(filepath, 'wx', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // convert data to a string
            const stringData = JSON.stringify(data)

            fs.writeFile(fileDescriptor, stringData, function(err) {
                if (!err) {
                    fs.close(fileDescriptor, function(err) {
                        if (!err) {
                            callback(false)
                            return;
                        }
                        callback("Error closing new file")
                    });
                    return 
                }

                callback("Error writing to new file")


            })

            return
        }
        callback('Could not create a new file, it may already exist')
    })
}


lib.read = function(dir, file, callback) {
    fs.readFile(path.join(lib.baseDir, dir, `${file}.json`), 'utf8', (err, content) => {
        if (err) return callback("error while reading the file")
        return callback(err, helpers.parseToJson(content))
    })
}

lib.delete = function(dir, file, callback) {
    fs.unlink(path.join(lib.baseDir, dir, `${file}.json`), err => {
        if (err) return callback(err)
        return callback(false)
    })
}

lib.update = function(dir, file, newData,callback) {
    const stringData = JSON.stringify(newData);

    fs.open(path.join(lib.baseDir, dir, `${file}.json`), 'r+', (err, fileDescriptor) => {
        if (err) return callback("Error while opening the file")

        fs.ftruncate(fileDescriptor, (err) => {
            if (err) return new callback("Error while truncating the file")
            fs.write(fileDescriptor, stringData, (err) => {
                if (err) return callback("Error while writing to file")

                fs.close(fileDescriptor, (err) => {
                    if (err) return callback("Error while closing the file")
                    return callback(false)
                })
            })
        })
    })
}

lib.list = (dir, callback) => {
    fs.readdir(path.join(lib.baseDir, dir), (err, files) => {
        if (err) return callback("Could not find directory")
        

        const trimmedFilePaths = files.map(fileName => {
            const split = fileName.split(".")
            return split.slice(0, split.length - 1).join(".")
        })
        return callback(null, trimmedFilePaths)
    })
}

module.exports = lib;