const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const index = require('./routes/index');

/** 1. 初始化 passport **/
const passport = require('passport');
const app = express();
//  ====> 2.2 配置 Local Strategy
const LocalStrategy = require('passport-local').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(passport.initialize());
app.use(passport.session());

/** 2. 初始化 Local Strategy 相关 **/
    //  ====> 2.1 初始化 database，这里通过 hash table 模拟
const users = [
    { id: '1', username: 'bob', password: 'secret', name: 'Bob Smith' },
    { id: '2', username: 'joe', password: 'password', name: 'Joe Davis' },
];

const User = {};

User.findById = (id, done) => {
    for (let i = 0, len = users.length; i < len; i++) {
        if (users[i].id === id) return done(null, users[i]);
    }
    return done(null, null);
};

User.findByUsername = (username, done) => {
    for (let i = 0, len = users.length; i < len; i++) {
        if (users[i].username === username) return done(null, users[i]);
    }
    // return done(new Error('User Not Found')); // 如何是这样的话，failureRedirect 就会失效，而直接进入 500 页面
    return done(null, null);
};

passport.use(new LocalStrategy(
    (username, password, done) => {
        User.findByUsername(username, (error, user) => {
            if (error) return done(error);
            if (!user) return done(null, false);
            if (user.password !== password) return done(null, false);
            return done(null, user);
        });
    }
));

passport.serializeUser((user, done ) => {
    console.log(user.id);
    done(null, user.id)
});
passport.deserializeUser((id, done) => {
    console.log(id);
    db.users.findById(id, (error, user) => done(error, user));
});

app.use('/', index);
app.get('/login', (request, response) => {response.render('login', { title: 'Express' })} )
app.post('/login', passport.authenticate('local', { 
    // successReturnToOrRedirect: '/',
    successRedirect: '/',
    failureRedirect: '/login',
    // session: false,
}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
