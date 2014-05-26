"use strict";

var Facebook = require("passport-facebook"),
    Lab = require("Lab"),
    test = Lab.test,
    nodemock = require("nodemock"),
    expect = Lab.expect;

Lab.experiment("Making sure that the passport-facebook works as expected", function () {

    test("simplest request", function (done) {
        var redirectMock = nodemock.mock("redirect").takes("https://www.facebook.com/dialog/oauth?response_type=code&redirect_uri=&client_id=myClientId"),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret"
            }, "http://callback");

        facebookImpl.redirect = redirectMock.redirect;
        facebookImpl.authenticate({}, {});
        redirectMock.assert();
        done();
    });

    test("Calling request", function (done) {
        var callbackURL = "http://google.com?hello&world",
            redirectMock = nodemock.mock("redirect").takes("https://www.facebook.com/dialog/oauth?response_type=code&redirect_uri=" + encodeURIComponent(callbackURL) + "&client_id=myClientId"),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret",
                callbackURL: callbackURL
            }, "http://callback");

        facebookImpl.redirect = redirectMock.redirect;
        facebookImpl.authenticate({}, {});
        redirectMock.assert();
        done();
    });
});