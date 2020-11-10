var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var session = require('express-session');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

// モデルの読み込み
var User = require('./models/user');
var Schedule = require('./models/schedule');
var Availability = require('./models/availability');
var Dates = require('./models/date');
User.sync().then(() => {
  Schedule.belongsTo(User, {foreignKey: 'createdBy'});
  Schedule.sync();
  Availability.belongsTo(User, {foreignKey: 'userId'});
  Dates.sync().then(() => {
    Availability.belongsTo(Dates, {foreignKey: 'dateId'});
    Availability.sync();
  });
});

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || require('./secret_info/github_info').GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || require('./secret_info/github_info').GITHUB_CLIENT_SECRET;

var session_info = process.env.SESSION_INFO || require('./secret_info/session_info');

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: process.env.HEROKU_URL ? process.env.HEROKU_URL + 'auth/github/callback' : 'http://localhost:8000/auth/github/callback'
},
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      const userId = profile.id;
      const userName = profile.username;

      User.findOne({
        where: {
          userId: userId
        }
      }).then((user) => {
        if(user) {
          user.userName = userName;
          user.save();
        }
        done(null, profile);
      });
    });
  }
));

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');
var slackIdRegisterRouter = require('./routes/slack-id-register');
var schedulesRouter = require('./routes/schedules');

var app = express();
app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: session_info, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/slack-id-register', slackIdRegisterRouter);
app.use('/schedules', schedulesRouter);

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  function (req, res) {
});

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    User.findOne({
      where: {
        userId: req.user.id
      }
    }).then((user) => {
      if(user) {
        res.redirect('/');
      } else {
        res.redirect('/slack-id-register');
      }
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
