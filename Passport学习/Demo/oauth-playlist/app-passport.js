const express = require('express');
const logger = require('morgan');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const WechatStrategy = require('passport-wechat');


const session = require('express-session');
const app = express();
app.use(logger('dev'));

const local_test = new LocalStrategy(function(username, password, done) {
    if (username === 'admin' && password === 'root') {
        return done(null, {id: '123', username: 'root'});
    }
    return done(null, false);
});

passport.use(new WechatStrategy({
    appID:'', // {APPID},
    name:'wechat-test-demo', // {默认为wechat,可以设置组件的名字}
    appSecret:'', // {APPSECRET},
    client: 'wechat',
    scope: 'snsapi_base',
    callbackURL:'szbteam.shangzhibo.tv/emma/wechat/callback', // {CALLBACKURL},
    state:'passport-test', // {STATE},
    getToken:'', // {getToken},
    saveToken:'', // {saveToken}
  }, function(accessToken, refreshToken, profile, done) {
    return done(err,profile);
  }
));

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'bla bla bla',
}));

// passport.initialize();
// passport.use(local_test);

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
      });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});


app.set('view engine', 'ejs');

// create home route
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/api/user', passport.authenticate(local_test), async (req, res) => {
    res.send('用户密码 认证成功了');
});


// ****************************************************************
app.get('/api/wechat', passport.authenticate('wechat-test-demo'), async (req, res) => {
    res.send('wechat authenticate Successfully !!!!!');
});

app.get('/emma/wechat/callback', passport.authenticate('wechat-test-demo'), async (req, res) => {
    res.send('wechat authenticate Successfully !!!!!');
});

app.listen(3000, () => {
    console.log('app listening on port 3000');
});

