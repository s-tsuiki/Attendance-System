'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Schedule = require('../models/schedule');
const Dates = require('../models/date');
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.get('/new', authenticationEnsurer, csrfProtection, (req, res, next) => {
  res.render('new', { user: req.user, csrfToken: req.csrfToken()});
});

router.post('/', authenticationEnsurer, csrfProtection, (req, res, next) => {
  const scheduleId = uuidv4();
  const updatedAt = new Date();
  Schedule.create({
    scheduleId: scheduleId,
    scheduleName: req.body.scheduleName,
    description: req.body.description,
    createdBy: req.user.id,
    updatedAt: updatedAt
  }).then((schedule) => {
    const dates = parseDates(req);
    createDatesAndRedirect(dates, res, scheduleId);
  });
});

router.get('/:scheduleId', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Schedule.findOne({
    include: [{
      model: User,
      attributes: ['userId', 'userName']
    }],
    where: {
      scheduleId: req.params.scheduleId
    },
    order: [['updatedAt', 'DESC']]
  }).then((schedule) => {
    if(schedule) {
      Dates.findAll({
        where: {
          scheduleId: schedule.scheduleId
        },
        order: [['dateId', 'ASC']]
      }).then((dates) => {
        res.render('schedule', {
          user: req.user,
          schedule: schedule,
          dates: dates,
          users: [req.user],
          csrfToken: req.csrfToken()
        });
      });
    } else {
      const err = new Error('指定された予定は存在しません');
      err.status = 404;
      next(err);
    }
  });
});

router.get('/:scheduleId/edit', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Schedule.findOne({
    where: {
      scheduleId: req.params.scheduleId
    }
  }).then((schedule) => {
    if(isMine(req, schedule)){
      Dates.findAll({
        where: {
          scheduleId: schedule.scheduleId
        },
        order: [['dateId', 'ASC']]
      }).then((dates) => {
        let dateString = '';
        for(let date of dates){
          dateString += date.date + '\n';
        }
        res.render('edit', {
          user: req.user,
          schedule: schedule,
          dates: dateString,
          csrfToken: req.csrfToken()
        });
      });
    } else {
      const err = new Error('指定された予定がない、または、予定する権限がありません');
      err.status = 404;
      next(err);
    }
  });
});

router.post('/:scheduleId', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Schedule.findOne({
    where: {
      scheduleId: req.params.scheduleId
    }
  }).then((schedule) => {
    if(schedule && isMine(req, schedule)){
      //?edit=1
      if(parseInt(req.query.edit) === 1){
        const updatedAt = new Date();
        schedule.update({
          scheduleId: schedule.scheduleId,
          scheduleName: req.body.scheduleName,
          description: req.body.description,
          createdBy: req.user.id,
          updatedAt: updatedAt
        }).then((schedule) => {
          const dates = parseDates(req);
          if(dates) {
            Dates.destroy({
              where: {
                scheduleId: schedule.scheduleId
              }
            }).then(() => {
              createDatesAndRedirect(dates, res, schedule.scheduleId);
            });
          } else {
            res.redirect('/schedules/' + schedule.scheduleId);
          }
        });
      } 
      //?delete=1
      else if(parseInt(req.query.delete) === 1){
        deleteScheduleAll(req.params.scheduleId, () => {
          res.redirect('/');
        });
      }
      else {
        const err = new Error('不正なリクエストです');
        err.status = 400
        next(err);
      }
    } else {
      const err = new Error('指定された予定がない、または、編集する権限がありません');
      err.status = 404;
      next(err);
    }
  });
});

function isMine(req, schedule)  {
  return schedule && parseInt(schedule.createdBy) === parseInt(req.user.id);
}

function createDatesAndRedirect(dates, res, scheduleId){
  const dateData = dates.map((d) => { return {
    date: d,
    scheduleId: scheduleId
  };});
  Dates.bulkCreate(dateData).then(() => {
    res.redirect('/');
  });
}

function parseDates(req) {
  return req.body.dates.trim().split('\n').map((s) => s.trim()).filter((s) => s !== "");
}

function deleteScheduleAll(scheduleId, done, err){
  Schedule.destroy({
    where: {
      scheduleId: scheduleId
    }
  }).then(() => {
    Dates.destroy({
      where: {
        scheduleId: scheduleId
      }
    }).then(() => {
      if (err) return done(err);
      done();
    })
  });
}

module.exports = router;