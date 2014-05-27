

```

var FacebookStrategy = require("passport-facebook"),
    facebookLogin = require("hapi-auth-passport")(new FacebookStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook"
    });

hapi.routes({
    method: "GET", path: "/login/facebook", handler: facebookLogin({
        onSuccess: function (user, request, reply) {
            // Store the user
            // Add the user info the session
        },
        onFailed: function (request, reply) {
        }
    })
});
```