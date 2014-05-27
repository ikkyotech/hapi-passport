"use strict";

var hp = require("../lib"),
    Lab = require("lab"),
    test = Lab.test,
    nodemock = require("nodemock"),
    expect = Lab.expect,
    requestStub = {};

Lab.experiment("Make sure that the facebook login", function () {

    test("should just work without any option", function (done) {
        hp({
            authenticate: function () { return undefined; }
        })()(requestStub, {});
        done();
    });

    test("should pass down the authentication", function (done) {
        var called = false;
        hp({
            authenticate: function () {
                called = true;
            }
        })({})(requestStub, {});
        expect(called).to.equal(true);
        done();
    });

    test("should put redirect on the strategies object", function (done) {
        var called = false,
            url = "hello world",
            responseMethod = function () {
                return {
                    redirect: function (resultUrl) {
                        expect(resultUrl).to.equal(url);
                        called = true;
                    }
                };
            };
        hp({
            authenticate: function () {
                this.redirect(url);
                expect(called).to.equal(true);
            }
        })({})(requestStub, responseMethod);
        done();
    });

    test("should pass failure's to the failure option", function (done) {
        var called = false,
            mockFail = function (error) {
                expect(error.message).to.equal("foo");
                called = true;
            };

        hp({
            authenticate: function () {
                this.fail({message: "foo"});
            }
        })({ onFailed: mockFail })(requestStub, {});
        expect(called).to.equal(true);
        done();
    });

    test("should pass error's to the error option", function (done) {
        var called = false,
            mockError = function mockError(error) {
                expect(error.message).to.equal("foo");
                called = true;
            };

        hp({
            authenticate: function () {
                this.error({message: "foo"});
            }
        })({ onError: mockError })(requestStub, {});
        expect(called).to.equal(true);
        done();
    });

    test("should pass error's to the error option", function (done) {
        var called = false,
            mockError = function mockError(error) {
                expect(error.message).to.equal("foo");
                called = true;
            };

        hp({
            authenticate: function () {
                this.error({message: "foo"});
            }
        })({ onError: mockError })(requestStub, {});
        expect(called).to.equal(true);
        done();
    });

    test("should use a error redirect if given", function (done) {
        var redirect = "http://test",
            originalError = {message: "foo"},
            called = "",
            replyMethod = function (message, error) {
                expect(message).to.equal("Error while trying to login...");
                expect(error).to.equal(originalError);
                called += "a";
                return {
                    redirect: function (uri) {
                        expect(uri).to.equal(redirect);
                        called += "b";
                    }
                };
            };

        hp({
            authenticate: function () {
                this.error(originalError);
            }
        })({ errorRedirect: redirect })(requestStub, replyMethod);
        expect(called).to.equal("ab");
        done();
    });

    test("should use a fail redirect if given", function (done) {
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
        })({ failRedirect: redirect })(requestStub, replyMethod);
        expect(called).to.equal("ab");
        done();
    });

    test("should use a success redirect if given", function (done) {
        var redirect = "http://test",
            originalError = {message: "foo"},
            called = "",
            replyMethod = function (message, error) {
                expect(message).to.equal("Login successful, redirecting...");
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
                this.success(originalError);
            }
        })({ successRedirect: redirect })(requestStub, replyMethod);
        expect(called).to.equal("ab");
        done();
    });

    test("should just reply with a error when a error occurs", function (done) {
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
        })()(requestStub, replyMethod);
        expect(called).to.equal("a");
        done();
    });

    test("should just reply with the fail message when a failure occurs", function (done) {
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
        })()(requestStub, replyMethod);
        expect(called).to.equal("a");
        done();
    });

    test("should just reply with the info message when the request was successful", function (done) {
        var originalInfo = {message: "foo"},
            called = "",
            replyMethod = function (error) {
                expect(error).to.equal(originalInfo);
                called += "a";
                return replyMethod;
            };

        hp({
            authenticate: function () {
                this.success(originalInfo);
            }
        })()(requestStub, replyMethod);
        expect(called).to.equal("a");
        done();
    });
});