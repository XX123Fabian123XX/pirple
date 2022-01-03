/*
* TEST RUNNER
*/

// Dependencies
const helpers = require("../lib/helpers");
const assert = require("assert");

// Application logic for the test runner
_app = {}


// container for the test
_app.tests = {
    'unit' : {}
}

// Assert that the getANumber function is returning a number
_app.tests.unit['helpers.getANumber should return a number'] = function(done) {
    const value = helpers.getANumber();
    assert.equal(typeof(value), "number")
}


// Assert that the getANumber function is returning a 1
_app.tests.unit['helpers.getANumber should return 1'] = function(done) {
    const val = helpers.getANumber();
    assert.equal(val, 1);
    done();
}

// Assert that the getANumber function is returning a 2
_app.tests.unit['helpers.getANumber should return 2'] = function(done) {
    const val = helpers.getANumber();
    assert.equal(val, 2);
    done();
}

_app.countTests = () => {
    let counter = 0;
    Object.entries(_app.tests).forEach(testSet => {
        counter += Object.keys(testSet).length;
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
            console.log(err.name);
            console.log(err.error);
        })

        console.log("-----------------END ERROR DETAILS---------------------")
    }
    console.log("")
    console.log("-----------------END TEST REPORT---------------------")

} 

console.log(_app.tests.unit)
// RUN the tests
_app.runTests();



