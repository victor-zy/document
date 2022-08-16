const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
const FileStore = require('session-file-store')(session);
const logger = require('morgan');

const indexRouter = require('./routes/index');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();

const options = {
    name: 'my.connect.sid',
    secret: 'sessionTest',//与cookieParser中的一致
    resave: true,
    saveUninitialized:true,
    cookie: { maxAge: 86400 },
    store: new FileStore(),
};

app.use(logger('dev'));
app.use(cookieParser('sessionTest'));
app.use(session(options));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use('local', new LocalStrategy(function(username, password, done) {
    if (username === 'admin' && password === 'root') {
        const user = {id: '123', username: 'root'};
        return done(null, user);
    }
    return done(null, false, {message: '密码或者用户名错误'});
}));
passport.serializeUser(function(user, cb) {
    console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
    console.log(user);
    return cb(null, user);
});
passport.deserializeUser(function(user, cb) {
    console.log('********************************');
    console.log(user);
    return cb(null, user);
});
passport.authenticateMiddleware = function authenticationMiddleware() {
    return function (req,res,next) {
        if (req.isAuthenticated()) return next(); 
        res.status(401).send('unauthorized');
    }
}



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/', indexRouter);
app.get('/login', passport.authenticate('local'), async (req, res) => {
    if (req.isAuthenticated()) {
        return res.send('Welcome to Admin');
    }
    res.send('login failed');
});

app.get('/api/user/:id', passport.authenticateMiddleware(), function(req, res, next) {
    const user={name: 'tiege', age: '100', email: 'tiege@gmail.com', address: '127.1.1.1'};
    req.session.user = user;
    res.send(user);
});

app.get('/logout', function(req, res, next) {
    console.log(req.session.id);
    req.session.destroy(function(err) {
        if (err) {
          console.error(err);
        } else {
          res.clearCookie(options.name);
          res.redirect('/');
        }
    });
});

app.listen(3000, () => {
    console.log('app listening on port 3000');
});