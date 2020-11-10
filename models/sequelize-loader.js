'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/lattendance'
);

module.exports = {
  Sequelize : Sequelize,
  database : sequelize
};