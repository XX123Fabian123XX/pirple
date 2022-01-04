const readline = require("readline");
const events = require("events");
const os = require("os");
const v8 = require("v8");
const _data = require("./data")
const _logs = require("./logs")
const helpers = require("./helpers");
const childProcess = require("child_process");

class _events extends events{}
const e = new _events();

// instantiate the cli module
const cli = {}

cli.horizontalLine = () => {
    const width = process.stdout.columns;
    const line = "-".repeat(width)
    console.log(line);
}

cli.verticalSpace = (lines) => {
    lines = typeof(lines) === "number" && lines > 0 ? lines : 1;
    for(let i = 0; i < lines; i++) {
        console.log("")
    }
}

cli.centered = (text) => {
    const width = process.stdout.columns;
    const spacesOnSides = Math.floor(width - text.length) / 2;

    const string = `${" ".repeat(spacesOnSides)}${text}${" ".repeat(spacesOnSides)}`

    console.log(string);
}

// responders object
cli.responders = {}

cli.responders.help = (str) => {
    const commands = {
    'man':"Show this help page",
    'help':"alias of the help page",
    'exit':"Kill the cli and the rest of the application",
    'stats':"get stats of the underlying operating system",
    'list users':"show a list of all of the registered users",
    'more user info --{userId}':"Shows user info about a specific user",
    'list checks --up --down':"Show a list of all of the active checks in the system, including their stats",
    'more check info --{checkId}':"Show details of a specified check",
    'list logs':"Show a list of all of the log files available to be read",
    'more log info --{fileName}':"Show details of a specified log file"
    }

    // show a header for the help page
    cli.horizontalLine();
    cli.centered('CLI MANUAL')
    cli.horizontalLine();
    
    Object.entries(commands).forEach(command => {
        let line = `\x1b[34m${command[0]}\x1b[0m`
        const padding = 40 - line.length;
        for (let i = 0; i < padding; i++) {
            line += " "
        }

        line+= command[1]
        console.log(line)

        
        cli.verticalSpace(1);
    })
    // end with a horizontal line
    cli.horizontalLine();

}   

cli.responders.exit = () => {
    process.exit(0)
}

cli.responders.stats = () => {
    const stats = {
        'Load average':os.loadavg().join(' '),
        'CPU Count':os.cpus().length,
        "Free Memory": os.freemem(),
        "Current Malloced Memory":v8.getHeapStatistics().malloced_memory,
        "Peak Malloced Memory":v8.getHeapStatistics().peak_malloced_memory,
        "Allocated Heap Used (%)": Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
        "Available Heap Allocated(%)":Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
        "Uptime":os.uptime() + " Seconds"
    }

    cli.horizontalLine();
    cli.centered("SYSTEM STATISTICS");
    cli.horizontalLine();

    Object.entries(stats).forEach(stat => {
        let line = `\x1b[34m${stat[0]}\x1b[0m`
        const padding = 40 - line.length;
        for (let i = 0; i < padding; i++) {
            line += " "
        }

        line+= stat[1]
        console.log(line)

        
        cli.verticalSpace(1);
    })

    // end with a horizontal line
    cli.horizontalLine();

}

cli.responders.listChecks = (str) => {
    // list checks --down --up
    const splitStr = str.split("--");
    console.log(splitStr)
    const trimmedSplitStr = splitStr.map(str => str.trim().toLowerCase())

    const downInString = trimmedSplitStr.includes("down")
    const upInString = trimmedSplitStr.includes("up");

    _data.list("checks", (err,checks) => {
        if (err) return;

        cli.horizontalLine();
        cli.centered("GET A LIST OF ALL OF THE CHECKS")
        cli.horizontalLine();
        checks.forEach(checkId => {
            _data.read("checks", checkId, (err, checkData) => {
                if (err) return
                if (checkData.state === "down" && upInString && !downInString) return 
                if (checkData.state === "up" && downInString && !upInString) return

                const line = `id ${checkData.id}, url ${checkData.url}, protcol ${checkData.protocol}, method ${checkData.method}, successCodes ${checkData.successCodes.join(" ")}, timeoutseconds ${checkData.timeoutSeconds}, state ${checkData.state}`
                console.log(line)
            })
        })

    })


}

cli.responders.moreCheckInfo = (str) => {
    const strSplit = str.split("--");
    const id = typeof(strSplit[1]) === "string" && strSplit[1].trim().length > 0 ? strSplit[1].trim() : false;

    if (!id) return;

    _data.read("checks", id, (err, checkData) => {
        if (err || !checkData) return 

        cli.horizontalLine();
        cli.centered(`Specific information about the check with id ${id}`)
        cli.horizontalLine();

        console.dir(checkData, {colors:true})
    })
}

cli.responders.moreLogInfo = (str) => {
    const strSplit = str.split("--");
    const id = typeof(strSplit[1]) === "string" && strSplit[1].trim().length > 0 ? strSplit[1].trim() : false
    
    if (!id) return false;

    _logs.read(id, (err, content) => {
        if (err) return
        cli.horizontalLine();
        cli.centered(`READING THE LOG FILE WITH NAME ${id}`)
        cli.horizontalLine();

        const arr = content.split("\n");

        arr.forEach(json => {
            const parseJson = helpers.parseToJson(json);
            if (parseJson && parseJson!=="{}") {
                console.dir(parseJson, {color:true})
            }
        })
    })
}

cli.responders.listLogs = () => {
    // get all of the files in the log folder
    const ls = childProcess.spawn('ls', ['./.logs/']);

    ls.stdout.on('data', (data) => {
        // Explode into seperate lines

        const dataStr = data.toString();

        const logFileNames = dataStr.split('\n');

        logFileNames.forEach(fileName => {
            if (typeof(fileName) ==="string" && fileName.length > 0) {
                console.log(fileName.split(".")[0]);
            }
        })

    })


}

cli.responders.moreUserInfo = (str) => {
    // get the user id from the string
    const strSplit = str.split("--")
    const userId = typeof(strSplit[1]) === "string" && strSplit[1].trim().length > 0 ? strSplit[1].trim() : false;
    if (!userId) return console.log("Please check your input format")

    // look the user up in the database
    _data.read("users", userId, (err, user) => {
        if (err) return console.log("This user was not found. It may not exist");
        cli.horizontalLine();
        cli.centered(`Specific User info about the user with id ${userId}`)
        cli.horizontalLine();

        delete user["hashedPassword"]

        console.dir(user, {"colors":true})

    })
}

cli.responders.listUsers = () => {

    // get all phone numbers from the filesystem
    _data.list("users", (err, files) => {
        if (err) return 

        cli.horizontalLine();
        cli.centered("OVERVIEW OF ALL OF THE USERS")
        cli.horizontalLine();

        console.log(`There are currently ${files.length} users registered in this system`);
        cli.verticalSpace();

        files.forEach((file, counter) => {
            _data.read("users", file, (err, data) => {
                if (err || !data) return;
                const line = `First Name ${data.firstName} || LastName ${data.lastName} || Phone ${data.phone} || Number of Checks ${data.checks ? data.checks.length : 0 } `;
                console.log(line);
                cli.verticalSpace();
            })
        })
    });
}


// input handlers
e.on('man', (str) => {cli.responders.help(str)});
e.on('help',(str) => {cli.responders.help(str)});
e.on('exit', cli.responders.exit)
e.on('stats', (str) => {cli.responders.stats(str)})
e.on('list users', (str) => {cli.responders.listUsers(str)})
e.on('more user info', (str) => {cli.responders.moreUserInfo(str)})
e.on('list checks', (str) => {cli.responders.listChecks(str)})
e.on('more check info',(str) => {cli.responders.moreCheckInfo(str)})
e.on('list logs', cli.responders.listLogs);
e.on('more log info', (str) => {cli.responders.moreLogInfo(str)})


cli.processInput = (str) => {
    str = typeof(str) === "string" && str.trim().length > 0 ? str.trim() : false

    if (!str) return;
    // codify the unique strings that identify the unique questions

    const uniqueInputs = [
        'man',
        'help',
        'exit',
        'stats',
        'list users',
        'more user info',
        'list checks',
        'more check info',
        'list logs',
        'more log info'
    ]
    let matchFound = false; 

    uniqueInputs.some((input) => {
        if (str.toLowerCase().includes(input)) {
            matchFound = true;
            e.emit(input, str)
            return true;
        } 
    })

    // go through the possible events and emit and 
    if (!matchFound) console.log("Sorry, try again");
}


cli.init = () => {
    // send the start message to the console in dark blue
    console.log('\x1b[34m%s\x1b[0m', `The cli is running`);

    // start the interface
    const _interface = readline.createInterface({
        input:process.stdin,
        output: process.stdout,
        prompt: ''
    });

    // create an initial prompt
    _interface.prompt();

    _interface.on('line', (str) => {
        // send to the input processor
        cli.processInput(str);

        // re-initialize the prompt afterwards
        _interface.prompt();
    })

    // if the user stops the cli, kill the associated process

    _interface.on('close', () => {
        process.exit(0);
    })
}





module.exports = cli;




