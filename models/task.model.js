'use strict';

const db = require('./database');
const Sequelize = require('sequelize');

// Make sure you have `postgres` running!

//---------VVVV---------  your code below  ---------VVV----------

const Task = db.define('Task', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  complete: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  due: Sequelize.DATE,
  timeRemaining: {
    type: Sequelize.VIRTUAL,
    get() {
      const dueDate = this.due
      return (!dueDate) ? Infinity : dueDate - Date.now()
    }
  }
});

Task.belongsTo(Task, {as: 'parent'});

Task.clearCompleted = function() {
  return this.destroy({ where: { complete: true } })
}

Task.completeAll = function() {
  return this.update(
    { complete: true },
    { where: { complete: false },
  })
}

Task.prototype.getTimeRemaining = function() {
  return !this.due ? Infinity : this.due - Date.now()
}

Task.prototype.isOverdue = function() {
  return !this.complete && this.getTimeRemaining() < 0
}

Task.prototype.addChild = function(child) {
  return Task.create({ ...child, parentId: this.id })
}

Task.prototype.getChildren = function() {
  return Task.findAll({ where: { parentId: this.id } })
}

Task.prototype.getSiblings = function() {
  return Task.findAll({
    where: {
      parentId: this.parentId,
      id: { $ne: this.id }
    }
  })
}

//---------^^^---------  your code above  ---------^^^----------

module.exports = Task;

