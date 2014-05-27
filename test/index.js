"use strict";

var hp = require("../lib"),
    Lab = require("lab"),
    test = Lab.test,
    nodemock = require("nodemock"),
    expect = Lab.expect;

Lab.experiment("Make sure that all we implement all we know of passport", function () {
    test("It should pass down the authentication", function (done) {
        var called = false;
        hp({
            authenticate: function () {
                called = true;
            }
        })({})(null, {});
        expect(called).to.equal(true);
        done();
    });

    test("It should put redirect on the strategies object", function (done) {
        var mockRedirect = function () { return undefined; };
        hp({
            authenticate: function () {
                expect(this.redirect).to.equal(mockRedirect);
            }
        })({})(null, {redirect: mockRedirect});
        done();
    });

    test("It should pass failure's to the failure option", function (done) {
        var called = false,
            mockFail = function (error) {
                expect(error.message).to.equal("foo");
                called = true;
            };

        hp({
            authenticate: function () {
                this.fail({message: "foo"});
            }
        })({ onFailed: mockFail })(null, {});
        expect(called).to.equal(true);
        done();
    });

    test("It should pass error's to the error option", function (done) {
        var called = false,
            mockError = function (error) {
                expect(error.message).to.equal("foo");
                called = true;
            };

        hp({
            authenticate: function () {
                this.error({message: "foo"});
            }
        })({ onError: mockError })(null, {});
        expect(called).to.equal(true);
        done();
    });
});