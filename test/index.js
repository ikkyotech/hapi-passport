"use strict";

var hp = require("../lib"),
    Lab = require("lab"),
    test = Lab.test,
    nodemock = require("nodemock"),
    expect = Lab.expect;

Lab.experiment("Make sure that all we implement all we know of passport", function () {

    test("It should just work without any option", function (done) {
        hp({
            authenticate: function () { return undefined; }
        })()(null, {});
        done();
    });

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
            mockError = function mockError(error) {
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

    test("It should pass error's to the error option", function (done) {
        var called = false,
            mockError = function mockError(error) {
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

    test("it should use a error redirect if given", function (done) {
        var redirect = "http://test",
            originalError = {message: "foo"},
            called = "",
            replyMethod = function (message, error) {
                expect(message).to.equal("Error while trying to login...");
                expect(error).to.equal(originalError);
                called += "a";
                return replyMethod;
            };

        replyMethod.redirect = function (uri) {
            expect(uri).to.equal(redirect);
            called += "b";
        };

        hp({
            authenticate: function () {
                this.error(originalError);
            }
        })({ errorRedirect: redirect })(null, replyMethod);
        expect(called).to.equal("ab");
        done();
    });

    test("it should use a fail redirect if given", function (done) {
        var redirect = "http://test",
            originalError = {message: "foo"},
            called = "",
            replyMethod = function (message, error) {
                expect(message).to.equal("Login failed, redirecting...");
                expect(error).to.equal(originalError);
                called += "a";
                return replyMethod;
            };

        replyMethod.redirect = function (uri) {
            expect(uri).to.equal(redirect);
            called += "b";
        };

        hp({
            authenticate: function () {
                this.fail(originalError);
            }
        })({ failRedirect: redirect })(null, replyMethod);
        expect(called).to.equal("ab");
        done();
    });

    test("it should just reply with a error when a error occurs", function (done) {
        var originalError = {message: "foo"},
            called = "",
            replyMethod = function (error) {
                expect(error).to.equal(originalError);
                called += "a";
                return replyMethod;
            };

        hp({
            authenticate: function () {
                this.error(originalError);
            }
        })()(null, replyMethod);
        expect(called).to.equal("a");
        done();
    });

    test("it should just reply with the fail message when a failure occurs", function (done) {
        var originalError = {message: "foo"},
            called = "",
            replyMethod = function (error) {
                expect(error).to.equal(originalError);
                called += "a";
                return replyMethod;
            };

        hp({
            authenticate: function () {
                this.fail(originalError);
            }
        })()(null, replyMethod);
        expect(called).to.equal("a");
        done();
    });
});