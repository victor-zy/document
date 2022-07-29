const passport = require('passport');

const WechatStrategy = require('passport-wechat');

passport.use(new WechatStrategy({
    appID:'', // {APPID},
    name:'wechat-test-demo', // {默认为wechat,可以设置组件的名字}
    appSecret:'', // {APPSECRET},
    client:'', // {wechat|web},
    callbackURL:'/emma/wechat/callback', // {CALLBACKURL},
    scope:'', // {snsapi_userinfo|snsapi_base},
    state:'', // {STATE},
    getToken:'', // {getToken},
    saveToken:'', // {saveToken}
  }, function(accessToken, refreshToken, profile, done) {
    return done(err,profile);
  }
));

router.get('/emma/wechat', passport.authenticate('wechat-test-demo', passportOption));


router.get('/emma/wechat/callback', passport.authenticate('wechat-test-demo', {
    failureRedirect: '/auth/fail',
    successReturnToOrRedirect: '/',
}));