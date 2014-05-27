"use strict";

module.exports = function hapiPassport(prototype) {
    var strategy = Object.create(prototype);
    return function createPassportLogin(options) {
        return function processLogin(request, reply) {
            strategy.redirect = reply.redirect;
            strategy.fail = function (warning) {
                options.onFailed(warning, request, reply);
            };
            strategy.error = function (error) {
                options.onError(error, request, reply);
            };
            strategy.authenticate(request);
        };
    };
};