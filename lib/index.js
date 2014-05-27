"use strict";

function onFailedDefault(warning, request, reply) {
    reply(warning);
    return request;
}

function onErrorDefault(error, request, reply) {
    reply(error);
    return request;
}

function def(options, prop, fallback) {
    if (!options[prop]) {
        options[prop] = fallback;
    }
}

module.exports = function hapiPassport(prototype) {
    var strategy = Object.create(prototype);
    return function createPassportLogin(options) {

        if (!options) {
            options = {};
        }

        function onFailedRedirect(warning, request, reply) {
            reply("Login failed, redirecting...", warning).redirect(options.failRedirect);
            return request;
        }

        function onErrorRedirect(error, request, reply) {
            reply("Error while trying to login...", error).redirect(options.errorRedirect);
            return request;
        }

        def(options, "onFailed", options.failRedirect  ? onFailedRedirect : onFailedDefault);
        def(options, "onError",  options.errorRedirect ? onErrorRedirect  : onErrorDefault);

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