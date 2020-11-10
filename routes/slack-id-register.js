'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const User = require('../models/user');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.get('/', authenticationEnsurer, csrfProtection, (req, res, next) => {
  res.render('slack-id-register', { user: req.user, csrfToken: req.csrfToken() });
});

router.post('/', authenticationEnsurer, csrfProtection, (req, res, next) => {
  const userId = req.user.id;
  const userName = req.user.username;
  const slackId = req.body.slackId;

  User.create({
    userId: userId,
    userName: userName,
    slackId: slackId
  }).then(() => {
    res.redirect('/');
  });
});

module.exports = router;