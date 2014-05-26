"use strict";

var hPass = require("../lib"),
    Lab = require("Lab"),
    test = Lab.test,
    nodemock = require("nodemock"),
    expect = Lab.expect;

Lab.experiment("Make sure that all we implement all we know of passport", function () {
    test("It should pass down the authentication", function (done) {
        var called = false,
            myClass = function () { return undefined; };
        myClass.prototype.authenticate = function () {
            called = true;
        };
        hPass(myClass)(null, {});
        expect(called).to.equal(true);
        done();
    });

    test("It should put redirect on the strategies object", function (done) {
        var mockRedirect = function () { return undefined; },
            myClass = function () { return undefined; };
        myClass.prototype.authenticate = function () {
            expect(this.redirect).to.equal(mockRedirect);
        };
        hPass(myClass)(null, {redirect: mockRedirect});
        done();
    });

    test("It should pass failure's to the failure option", function (done) {
        var called = false,
            mockFail = function (error) {
                expect(error.message).to.equal("foo");
                called = true;
            },
            myClass = function () { return undefined; };
        myClass.prototype.authenticate = function () {
            this.fail({message: "foo"});
        };

        hPass(myClass, { fail: mockFail })(null, {});
        expect(called).to.equal(true);
        done();
    });
});