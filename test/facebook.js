"use strict";

var Facebook = require("passport-facebook"),
    Lab = require("lab"),
    test = Lab.test,
    nodemock = require("nodemock"),
    expect = Lab.expect;

function dontCall() {
    throw new Error("This shouldn't be called.");
}

Lab.experiment("Making sure that the passport-facebook works as expected", function () {

    test("simplest request", function (done) {
        var redirectMock = nodemock.mock("redirect").takes("https://www.facebook.com/dialog/oauth?response_type=code&redirect_uri=&client_id=myClientId"),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret"
            }, dontCall);

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
            }, dontCall);

        facebookImpl.redirect = redirectMock.redirect;
        facebookImpl.authenticate({}, {});
        redirectMock.assert();
        done();
    });

    test("With a access denied error", function (done) {
        var callbackURL = "http://google.com?hello&world",
            errorDescription = "Just some error message",
            failMock = nodemock.mock("failF").takesF(function (error) {
                return error.message === errorDescription;
            }),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret",
                callbackURL: callbackURL
            }, dontCall);

        facebookImpl.fail = failMock.failF;
        facebookImpl.authenticate({
            query: {
                error: "access_denied",
                error_description: errorDescription
            }
        }, {});
        failMock.assert();
        done();
    });

    test("With a other error", function (done) {
        // Please see also http://tools.ietf.org/html/draft-ietf-oauth-v2-30#page-26
        var AuthorizationError = require('passport-oauth2/lib/errors/authorizationerror'),
            errorToken = Math.random().toString(),
            errorUri = 'http://error.uri' + errorToken,
            errorDescription = 'error desu' + errorToken,
            errorMock = nodemock.mock('error')
                .takesF(function (error) {
                    // console.log(error);
                    if (!(error instanceof AuthorizationError)) {
                        return false;
                    }
                    if (error.uri !== errorUri) {
                        return false;
                    }
                    // if(error.code === 'access_denied') return error.status === 403;
                    if (error.code === 'server_error') {
                        return error.status === 502;
                    }
                    if (error.code === 'temporarily_unavailable') {
                        return error.status === 503;
                    }
                    // return error instanceof AuthorizationError;
                    return error.status === 500;
                })
                .times(7),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret"
            }, dontCall);

        facebookImpl.error = errorMock.error;
        // facebookImpl.authenticate({ query: { error: 'access_denied' } }, {});
        facebookImpl.authenticate({ query: { error: 'invalid_scope',             error_description: errorDescription, error_uri: errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'invalid_request',           error_description: errorDescription, error_uri: errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'invalid_client',            error_description: errorDescription, error_uri: errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'unauthorized_client',       error_description: errorDescription, error_uri: errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'unsupported_response_type', error_description: errorDescription, error_uri: errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'temporarily_unavailable',   error_description: errorDescription, error_uri: errorUri } }, {});
        facebookImpl.authenticate({ query: { error: 'server_error',              error_description: errorDescription, error_uri: errorUri } }, {});

        errorMock.assert();
        done();
    });

    test("attempting a successful response", function (done) {
        var code = "abcd",
            accessToken = "accessToken1",
            refreshToken = "refreshToken1",
            infoInput = "some Input",
            profile = { id: "id" },
            oauth2 = '_oauth2',
            oauthMock = nodemock.mock("getOAuthAccessToken").takesF(function (inCode, params, callback) {
                expect(inCode).to.equal(code);
                expect(params).to.eql({
                    grant_type: 'authorization_code',
                    redirect_uri: undefined
                });
                expect(typeof callback).to.equal("function");
                callback(null, accessToken, refreshToken, params);
                return true;
            }).mock("get")
                .takes("https://graph.facebook.com/me", accessToken, function () { return undefined; })
                .calls(2, [null, JSON.stringify(profile)]),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret"
            }, function (passAccessToken, passRefreshToken, profile, verified) {
                expect(passAccessToken).to.equal(accessToken);
                expect(passRefreshToken).to.equal(refreshToken);
                expect(profile).to.equal(profile);
                verified(null, infoInput);
            });
        facebookImpl[oauth2] = oauthMock;
        facebookImpl.success = function (info) {
            expect(info).to.equal(infoInput);
            done();
        };
        facebookImpl.authenticate({ session: {}, query: { code: code } });
    });
});

Lab.experiment("authorizationParams", function () {
    test("normal patterns", function (done) {
        // Please see also https://developers.facebook.com/docs/reference/dialogs/oauth/
        var options,
            displayList = ['page', 'popup', 'iframe', 'async', 'touch'],
            authTypeList = ['https', 'reauthenticate'],
            params,
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret"
            }, dontCall);
        displayList.forEach(function (display) {
            authTypeList.forEach(function (authType) {
                options = {
                    display: display,
                    authType: authType,
                    authNonce: Math.random().toString()
                };
                params = facebookImpl.authorizationParams(options);
                expect(params.display).to.equal(options.display);
                expect(params.auth_type).to.equal(options.authType);
                expect(params.auth_nonce).to.equal(options.authNonce);
            });
        });
        done();
    });
});

Lab.experiment("userProfile", function () {
    test("normal patterns", function (done) {
        var InternalOAuthError = require('passport-oauth2').InternalOAuthError,
            FacebookGraphAPIError = require('passport-facebook/lib/errors/facebookgraphapierror'),
            profileURL = 'http://www.facebook.com/AtuyL',
            accessToken = 'dummy-access-token',
            errorObjectList = [
                "error: string",
                {
                    message: 'error: json',
                    type: 'type',
                    code: 'code',
                    error_subcode: 'error_subcode'
                },
                null
            ],
            errorPatterns = [
                errorObjectList[0], // InternalOAuthError
                { data: JSON.stringify({ error: errorObjectList[1] }) }, // FacebookGraphAPIError
                errorObjectList[2] // not error
            ],
            bodyObjectList = [
                "{ unparsable json }",
                {
                    id: "id",
                    username: "username",
                    name: "name",
                    last_name: "last_name",
                    first_name: "first_name",
                    middle_name: "middle_name",
                    gender: "gender",
                    link: "link",
                    email: "email",
                    picture: "picture"
                },
                {
                    id: "id",
                    username: "username",
                    name: "name",
                    last_name: "last_name",
                    first_name: "first_name",
                    middle_name: "middle_name",
                    gender: "gender",
                    link: "link",
                    email: "email",
                    picture: {
                        data: {
                            url: "picture_data_url"
                        }
                    }
                }
            ],
            bodyPatterns = [
                bodyObjectList[0],
                JSON.stringify(bodyObjectList[1]),
                JSON.stringify(bodyObjectList[2])
            ],
            facebookImpl = new Facebook({
                clientID: "800464516633425",
                clientSecret: "b78c7b021c42acb72242f1d7e354264a",
                callbackURL: "http://localhost:8080/callback",
                profileURL: profileURL
            }, dontCall);

        facebookImpl.redirect = function (authpath) {
            console.log(authpath);
        };

        errorPatterns.forEach(function (error) {
            bodyPatterns.forEach(function (body, bIndex) {

                var mockOauth2 = nodemock.mock('get')
                    .takes(profileURL, accessToken, function () { return undefined; })
                    .calls(2, [error, body, {}]),
                    oauth2 = '_oauth2';
                facebookImpl[oauth2] = mockOauth2;
                facebookImpl.userProfile(accessToken, function (e, p) {
                    if (e) {
                        if (e instanceof InternalOAuthError) {
                            expect(p).to.equal(undefined);
                            expect(e.name).to.equal('InternalOAuthError');
                            expect(e.message).to.equal('Failed to fetch user profile');
                            expect(e.oauthError).to.equal(errorObjectList[0]);
                        } else if (e instanceof FacebookGraphAPIError) {
                            expect(p).to.equal(undefined);
                            expect(e.name).to.equal('FacebookGraphAPIError');
                            expect(e.message).to.equal(errorObjectList[1].message);
                            expect(e.type).to.equal(errorObjectList[1].type);
                            expect(e.code).to.equal(errorObjectList[1].code);
                            expect(e.subcode).to.equal(errorObjectList[1].error_subcode);
                            expect(e.status).to.equal(500);
                        } else if (e instanceof Error) {
                            expect(e.message).to.equal('Failed to parse user profile');
                        } else {
                            done(new Error('Unexpected Error Type.'));
                        }
                    } else {
                        expect(e).to.equal(null);
                        var ref = bodyObjectList[bIndex];
                        expect(p.id).to.equal(ref.id);
                        expect(p.username).to.equal(ref.username);
                        expect(p.displayName).to.equal(ref.name);
                        expect(p.name.familyName).to.equal(ref.last_name);
                        expect(p.name.givenName).to.equal(ref.first_name);
                        expect(p.name.middleName).to.equal(ref.middle_name);
                        expect(p.gender).to.equal(ref.gender);
                        expect(p.profileUrl).to.equal(ref.link);
                        expect(p.emails[0].value).to.equal(ref.email);
                        if (typeof ref.picture === 'string') {
                            expect(p.photos[0].value).to.equal(ref.picture);
                        } else {
                            expect(p.photos[0].value).to.equal(ref.picture.data.url);
                        }
                        expect(p.provider).to.equal('facebook');
                    }
                });
            });
        });
        done();
    });
});