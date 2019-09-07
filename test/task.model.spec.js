/* eslint-disable no-unused-expressions */
/* eslint-env mocha, chai */
'use strict';

const helper = require('./helper');
const expect = require('chai').expect;
const db = require('../models/database');
const Task = require('../models/task.model');

/**
 * Start here
 *
 * These tests describe the model that you'll be setting up in models/task.model.js
 *
 */

describe('Task', function () {

  // clear the database before all tests
  before(() => {
    return db.sync({force: true});
  });

  // erase all tasks after each spec
  afterEach(() => {
    return db.sync({force: true});
  });

  describe('Class methods', function () {

    beforeEach(async () => {
      await Promise.all([
        Task.create({ name: 't1', due: helper.dates.tomorrow() }),
        Task.create({ name: 't2', due: helper.dates.tomorrow(), complete: true }),
        Task.create({ name: 't3', due: helper.dates.yesterday() }),
        Task.create({ name: 't4', due: helper.dates.yesterday(), complete: true })
      ]);
    });

    describe('clearCompleted', function () {
      it('removes all completed tasks from the database', async function () {
        await Task.clearCompleted();

        const completedTasks = await Task.findAll({ where: { complete: true } });
        const incompleteTasks = await Task.findAll({ where: { complete: false } });

        expect(completedTasks).to.have.length(0);
        expect(incompleteTasks).to.have.length(2);
      });
    });

    describe('completeAll', function () {

      it('marks all incomplete tasks as completed', async function () {
        await Task.completeAll();

        const completedTasks = await Task.findAll({ where: { complete: true } });
        const incompleteTasks = await Task.findAll({ where: { complete: false } });

        expect(completedTasks).to.have.length(4);
        expect(incompleteTasks).to.have.length(0);
      });

    });

  });

  describe('Instance methods', function () {

    describe('getTimeRemaining', function () {

      it('returns the Infinity value if task has no due date', function () {
        const task = Task.build();
        expect(task.getTimeRemaining()).to.equal(Infinity);
      });

      it('returns the difference between due date and now', function () {
        const oneDay = 24 * 60 * 60 * 1000; // one day in milliseconds

        // create a task due one day from this point in time
        const task = Task.build({
          due: helper.dates.tomorrow()
        });

        expect(task.getTimeRemaining()).to.be.closeTo(oneDay, 10); // within 10 ms
      });

    });

    describe('isOverdue', function () {

      it('is overdue if the due date is in the past', function () {
        const task = Task.build({
          due: helper.dates.yesterday()
        });
        expect(task.isOverdue()).to.be.true;
      });

      it('is not overdue if the due date is in the past but complete is true', function () {
        const task = Task.build({
          due: helper.dates.yesterday(),
          complete: true
        });
        expect(task.isOverdue()).to.be.false;
      });

      it('is not overdue if the due date is in the future', function () {
        const task = Task.build({
          due: helper.dates.tomorrow()
        });
        expect(task.isOverdue()).to.be.false;
      });
    });

    describe('addChild', function () {

      it('should return a promise for the new child', async function () {
        const parentTask = await Task.create({ name: 'parent task' });
        const childTask = await parentTask.addChild({ name: 'child task' });
        expect(childTask.name).to.equal('child task');
        expect(childTask.parentId).to.equal(parentTask.id);
      });

    });

    describe('getChildren', function () {

      it('should return a promise for an array of the task\'s children', async function () {
        const parentTask = await Task.create({ name: 'parent task' });
        await parentTask.addChild({ name: 'child task' });
        await parentTask.addChild({ name: 'child task 2' });

        const children = await parentTask.getChildren();

        expect(children).to.have.length(2);
        expect(children[0].name).to.equal('child task');
      });

    });

    describe('getSiblings', function () {

      it('returns a promise for an array of siblings', async function () {
        const parentTask = await Task.create({ name: 'parent task' });
        const firstChild = await parentTask.addChild({ name: 'first child' });
        const secondChild = await parentTask.addChild({ name: 'second child' });

        const siblings = await firstChild.getSiblings();
        expect(siblings).to.have.length(1);
        expect(siblings[0].id).to.equal(secondChild.id);
      });

    });

  });

});
