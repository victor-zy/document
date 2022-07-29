const OAuth2Strategy = require('passport-oauth2');

passport.use(new OAuth2Strategy({
    authorizationURL: 'https://divineswordvilla.xyz/oauth2/authorize',
    tokenURL: 'https://divineswordvilla.xyz/oauth2/token',
    clientID: EXAMPLE_CLIENT_ID,
    clientSecret: EXAMPLE_CLIENT_SECRET,
    callbackURL: "http://divineswordvilla.xyz/auth/emma/callback"
},function(accessToken, refreshToken, profile, cb) {
    // 业务逻辑处理
    if (err) return cb(err);
    return cb(null, profile);
}));

router.get('/emma/login', passport.authenticate('oauth2'));
router.get('auth/emma/callback', passport.authenticate('oauth2', { failureRedirect: '/login' }), function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});