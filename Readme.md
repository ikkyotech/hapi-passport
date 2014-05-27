hapi-passport
=============

```hapi-passport``` is supposed to be a connector between passport.js strategies and the [hapi](https://github.com/spumko/hapi) request api. Right now its in a early phase so its only tested with facebook.

usage
=====

You need to install ```hapi-passort``` together with the connector strategies like ```passport-facebook```. 

```bash
$ npm install hapi-passport passport-facebook
```

With this you can make a request handler like this:

```javascript
var FacebookStrategy = require("passport-facebook"),
    facebookLogin = require("hapi-auth-passport")(new FacebookStrategy(...));
```

and connect it hapi using

```javascript
server.routes({method: "GET", path: "/login/facebook", facebookLogin() });
```

By default it would just show loose error or success messages. You can work around that by passing redirect urls for the different cases:

```javascript
server.routes({method: "GET", path: "/login/facebook", facebookLogin({
    successRedirect: "http://mydomain/login/success",
    errorRedirect: "http://mydomain/login/error",
    failRedirect: "http://mydomain/login/failed"
});
```

... or you can use handlers for the various cases:

```javascript
server.routes({
    method: "GET", path: "/login/facebook", handler: facebookLogin({
        onSuccess: function (info, request, reply) {
            // maybe do a redirect?
        },
        onFailed: function (warning, request, reply) {
            // maybe show an error?
        },
        onError: function (error, request, reply) {
            // tell the world that you are angry.
        }
    })
});
```

Resulting into something like:

```javascript
var FacebookStrategy = require("passport-facebook"),
    facebookLogin = require("hapi-auth-passport")(new FacebookStrategy({
        clientID: "FACEBOOK_APP_ID", // Facebook app id
        clientSecret: "FACEBOOK_APP_SECRET", // Facebook secret
        callbackURL: "http://localhost:3000/login/facebook" // needs to be added in the facebook admin interface
    }, function verify(accessToken, refreshToken, profile, verified) {
        verified(error, info);
    }));

server.routes({
    method: "GET", path: "/login/facebook", handler: facebookLogin({
        onSuccess: function (info, request, reply) {
            // maybe do a redirect?
        },
        onFailed: function (warning, request, reply) {
            // maybe show an error?
        },
        onError: function (error, request, reply) {
            // tell the world that you are angry.
        }
    })
});
```