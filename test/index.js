"use strict";

var hPass = require("../lib"),
    Lab = require("Lab"),
    test = Lab.test,
    nodemock = require("nodemock"),
    expect = Lab.expect;

Lab.experiment("Make sure that all we implement all we know of passport", function () {
    test("It should put redirect on the strategies object", function (done) {

        var mockRedirect = function () { return undefined; },
            called = false,
            myClass = function () { return undefined; };
        myClass.prototype.authenticate = function () {
            expect(this.redirect).to.equal(mockRedirect);
            called = true;
        };
        hPass(myClass)(null, {redirect: mockRedirect});
        expect(called).to.equal(true);
        done();
    });
});