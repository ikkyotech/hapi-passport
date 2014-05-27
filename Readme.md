

```

var FacebookStrategy = require("passport-facebook"),
    facebookLogin = require("hapi-auth-passport")(new FacebookStrategy({
        clientID: "FACEBOOK_APP_ID", // Facebook app id
        clientSecret: "FACEBOOK_APP_SECRET", // Facebook secret
        callbackURL: "http://localhost:3000/auth/facebook" // needs to be added in the admin interface
    }, function verify(accessToken, refreshToken, profile, verified) {

    }));

hapi.routes({
    method: "GET", path: "/login/facebook", handler: facebookLogin({
        onSuccess: function (user, request, reply) {
            // Store the user
            // Add the user info the session
        },
        onFailed: function (warning, request, reply) {
        },
        onError: function (error, request, reply) {
        }
    })
});
```