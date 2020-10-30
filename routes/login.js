'use strict';
const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('login', { user: req.user, login_page: true });
});

module.exports = router;