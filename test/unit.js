const helpers = require("../lib/helpers");
const assert = require("assert");
const logs = require("../lib/logs");
const exampleDebuggingProblem = require("../lib/exampleDebuggingProblem");

unitTests = {};

// Assert that the getANumber function is returning a number
unitTests['helpers.getANumber should return a number'] = function(done) {
    const value = helpers.getANumber();
    assert.equal(typeof(value), "number")
    done();
}


// Assert that the getANumber function is returning a 1
unitTests['helpers.getANumber should return 1'] = function(done) {
    const val = helpers.getANumber();
    assert.equal(val, 1);
    done();
}

// Assert that the getANumber function is returning a 2
unitTests['helpers.getANumber should return 2'] = function(done) {
    const val = helpers.getANumber();
    assert.equal(val, 2);
    done();
}

// logs list should return back an array and an error of false
unitTests['logs.list should return back an array of log names and an error of false'] = function(done) {
    logs.list(true, (err, logFileNames) => {
        assert.equal(err, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
        done();
    })
}

// example problem that should not throw
unitTests['logs.truncate should not throw if the log id does not exist'] = function(done) {
    assert.doesNotThrow(function() {
        logs.truncate("I do not exist", function(err) {
            assert.ok(err);
            done();
        })
    }, TypeError)
}

unitTests['example debugging problem.init should not throw when called'] = function(done) {
    assert.doesNotThrow(function() {
        exampleDebuggingProblem.init();
        done();
    })
}






module.exports = unitTests;