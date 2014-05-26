"use strict";

module.exports = function hapi_passport(Strategy, options) {
    var instance = new Strategy();

    if (!options) {
        options = {};
    }

    return function (request, reply) {
        instance.redirect = reply.redirect;
        instance.fail = options.fail || function () { return undefined; };
        instance.authenticate(request, {});
    };
};