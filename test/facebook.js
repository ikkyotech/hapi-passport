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

    test("With a access denied error", function (done) {
        var callbackURL = "http://google.com?hello&world",
            errorDescription = "Just some error message",
            failMock = nodemock.mock("_fail").takesF(function (error) {
                return error.message === errorDescription;
            }),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret",
                callbackURL: callbackURL
            }, "http://callback");

        facebookImpl.fail = failMock._fail;
        facebookImpl.authenticate({
            query: {
                error: "access_denied",
                error_description: errorDescription
            }
        }, {});
        failMock.assert();
        done();
    });

    test("Authorization Error", function (done) {
        var AuthorizationError = require('passport-oauth2/lib/errors/authorizationerror'),
            errorToken = (Math.random() * 100 | 0).toString(),
            errorUri = 'http://error.uri' + errorToken,
            errorDescription = 'error desu' + errorToken,
            errorMock = nodemock.mock('error')
                .takesF(function (error) {
                    // console.log(error);
                    if( !(error instanceof AuthorizationError) ) return false;
                    if( error.uri !== errorUri) return false;
                    // if(error.code === 'access_denied') return error.status === 403;
                    if(error.code === 'server_error') return error.status === 502;
                    if(error.code === 'temporarily_unavailable') return error.status === 503;
                    // return error instanceof AuthorizationError;
                    return error.status === 500;
                })
                .times(7),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret"
            }, "http://callback");

        facebookImpl.error = errorMock.error;
        // facebookImpl.authenticate({ query: { error: 'access_denied' } }, {});
        facebookImpl.authenticate({ query: { error: 'invalid_scope', error_description:errorDescription, error_uri:errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'invalid_request', error_description:errorDescription, error_uri:errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'invalid_client', error_description:errorDescription, error_uri:errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'unauthorized_client', error_description:errorDescription, error_uri:errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'unsupported_response_type', error_description:errorDescription, error_uri:errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'temporarily_unavailable', error_description:errorDescription, error_uri:errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'server_error', error_description:errorDescription, error_uri:errorUri } }, {});
        errorMock.assert();
        done();
    });
});