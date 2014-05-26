"use strict";

module.exports = function hapi_passport(Strategy) {
    var instance = new Strategy();
    return function (request, reply) {
        instance.redirect = reply.redirect;
        instance.authenticate(request, {});
    };
};