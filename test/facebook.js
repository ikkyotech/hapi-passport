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

    test("With a other error", function (done) {
        var AuthorizationError = require('passport-oauth2/lib/errors/authorizationerror'),
            errorToken = (Math.random() * 100 | 0).toString(),
            errorUri = 'http://error.uri' + errorToken,
            errorDescription = 'error desu' + errorToken,
            errorMock = nodemock.mock('error')
                .takesF(function (error) {
                    if( !(error instanceof AuthorizationError) ) return false;
                    if( error.uri !== errorUri) return false;
                    if( error.message !== errorDescription) return false;
                    if(error.code === 'access_denied') return error.status === 403;
                    if(error.code === 'server_error') return error.status === 502;
                    if(error.code === 'temporarily_unavailable') return error.status === 503;
                    // return error instanceof AuthorizationError;
                    return error.status === 500;
                })
                .times(7),
            // Please see also http://tools.ietf.org/html/draft-ietf-oauth-v2-30#page-26
            errorList = [
                'invalid_scope', 'invalid_request', 'invalid_client',
                'unauthorized_client', 'unsupported_response_type',
                'temporarily_unavailable',
                'server_error'
            ],
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret"
            }, "http://callback");

        facebookImpl.error = errorMock.error;
        // facebookImpl.authenticate({ query: { error: 'access_denied' } }, {});
        errorList.forEach(function (error) {
            facebookImpl.authenticate({
                query: {
                    error: 'invalid_scope',
                    error_description: errorDescription,
                    error_uri: errorUri
                }
            }, {});
        });
        
        errorMock.assert();
        done();
    });
});

Lab.experiment("authorizationParams", function () {
    test("normal patterns", function (done) {
        // Please see also https://developers.facebook.com/docs/reference/dialogs/oauth/
        var options,
            displayList = ['page', 'popup', 'iframe', 'async', 'touch'],
            authTypeList = ['https', 'reauthenticate'],
            params,
            errorToken = (Math.random() * 100 | 0).toString(),
            facebookImpl = new Facebook({
                clientID: "myClientId",
                clientSecret: "myClientSecret"
            }, "http://callback");
        displayList.forEach(function (display) {
            authTypeList.forEach(function (authType) {
                options = {
                    display: display,
                    authType: authType,
                    authNonce: (Math.random() * 1000 | 0).toString()
                }
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
                    message:'error: json',
                    type:'type',
                    code:'code',
                    error_subcode:'error_subcode'
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
            }, "http://callback");

        facebookImpl.redirect = function (authpath) {
            console.log(authpath);
        };

        errorPatterns.forEach(function (error, eIndex) {
            bodyPatterns.forEach(function (body, bIndex) {
                // console.log('\n--------', 'error:', eIndex, 'body:', bIndex);
                // console.log(error);
                // console.log(body);

                facebookImpl._oauth2 = nodemock.mock('get')
                    .takes( profileURL, accessToken, function (){} )
                    .calls(2, [error, body, {}]);
                facebookImpl.userProfile(accessToken, function (e, p) {
                    if (e) {
                        if (e instanceof InternalOAuthError){
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
                    }else{
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
                        if(typeof ref.picture === 'string'){
                            expect(p.photos[0].value).to.equal(ref.picture);
                        }else{
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