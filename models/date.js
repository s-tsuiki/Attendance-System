'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Dates = loader.database.define(
  'dates',
  {
    dateId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    date: {
      type: Sequelize.STRING,
      allowNull: false
    },
    memo: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    scheduleId: {
      type: Sequelize.UUID,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['scheduleId']
      }
    ]
  }
);

module.exports = Dates;