/*
* TEST RUNNER
*/

process.env.NODE_ENV="testing";

// Application logic for the test runner
_app = {}

// container for the test
_app.tests = {}
_app.tests.unit = require("./unit");
_app.tests.api = require("./api");

_app.countTests = () => {
    let counter = 0;
    Object.entries(_app.tests).forEach(testSet => {
        counter += Object.keys(testSet[1]).length;
    })
    return counter;
}

// run all tests collecting errors and successes
_app.runTests = function() {
    const errors = []
    let successes = 0;
    const limit = _app.countTests();
    let counter = 0;
    Object.entries(_app.tests).forEach(test => {
        const subTests = test[1];

        Object.entries(subTests).forEach(subTest => {
            (function() {
                const tmpTestName = subTest[0];
                const testValue = subTest[1];

                // call the test
                try {
                    testValue(function() {
                        successes++;
                        counter++;
                        console.log('\x1b[32m%s\x1b[0m', `${tmpTestName} succeeded`)

                        if (counter === limit) _app.produceTestReport(limit,successes, errors);
                    });
                } catch(e) {
                    errors.push({
                        name:tmpTestName,
                        error:e
                    });
                    console.log('\x1b[31m%s\x1b[0m', `${tmpTestName} did not succeed`)
                    counter++

                    if (counter === limit) _app.produceTestReport(limit, successes, errors);

                }
            })()
        })
    })
}


_app.produceTestReport = (limit, successes, errors) => {
    console.log("")
    console.log("-----------------BEGIN TEST REPORT---------------------")
    console.log(`Total Tests: `, limit);
    console.log(`Pass: `, successes);
    console.log(`Total Errors: `, errors.length)
    console.log("");

    // if there are any errors print them in detail
    if (errors.length > 0) {
        console.log("-----------------BEGIN ERROR DETAILS---------------------")

        errors.forEach((err) => {
            console.log('\x1b[31m%s\x1b[0m', `${err.name} did not succeed`)
            console.log(err.error);
        })

        console.log("-----------------END ERROR DETAILS---------------------")
    }
    console.log("")
    console.log("-----------------END TEST REPORT---------------------")

    // kill the app because several process have been started
    process.exit(0);
} 

// RUN the tests
_app.runTests();



