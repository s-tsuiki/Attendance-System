'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/lattendance'
);

module.exports = {
  Sequelize : Sequelize,
  database : sequelize
};