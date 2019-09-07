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
  due: Sequelize.DATE
});

Task.clearCompleted = async function() {
  await this.destroy({ where: { complete: true } })
}

Task.completeAll = async function() {
  await this.update(
    { complete: true },
    { where: { complete: false },
  })
}

Task.prototype.getTimeRemaining = function() {
  const dueDate = this.get().due
  return (!dueDate) ? Infinity : dueDate - Date.now()
}

Task.prototype.isOverdue = function() {
  const dueDate = this.get().due
  const completed = this.get().complete
  const now = Date.now()

  return (!completed && now > dueDate)
}

Task.prototype.addChild = async function(child) {
  const newChild = await Task.create({ name: child.name, parentId: this.id})
  let children = this.getDataValue("children")

  if (!children) {
    children = [];
  }

  children.push(newChild)
  this.setDataValue("children", children)

  return newChild
}

Task.prototype.getChildren = function() {
  return this.get().children
}

Task.prototype.getSiblings = async function() {
  const parentId = this.get().parentId
  const siblings = await Task.findAll({ where: { parentId } })
  return siblings.filter(child => child.id !== this.id)
}



Task.belongsTo(Task, {as: 'parent'});


//---------^^^---------  your code above  ---------^^^----------

module.exports = Task;

