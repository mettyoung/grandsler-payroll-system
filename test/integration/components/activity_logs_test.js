/**
 * Test Helpers
 */
require('../../helpers/chai_with_promised');
const {ngModule, inject} = require('../../helpers/angular_test_setup');
const transactionScope = require('../../helpers/transaction_scope');
const auth = require('../../../app/models/domain/authentication');
const moment = require('moment');
const capitalize = require('lodash.capitalize');

/**
 * System Under Test
 */
require('../../../app/components/change_password/change_password.module');
require('../../../app/components/change_password/change_password.component');
require('../../../app/components/activity_logs/activity_logs.module');
require('../../../app/components/activity_logs/activity_logs.component');
const {UserLog} = require('../../../app/models/persistence/index');

/**
 * Specs
 */
describe('Activity Logs Angular Component', function ()
{
  const ADMIN_USER = {
    id: 1,
    username: "admin",
    password: "admin"
  };

  const USER_LOG_ENTRY = {
    user_id: ADMIN_USER.id,
    username: ADMIN_USER.username,
    module: 'Account Settings',
    description: 'Changed password successfully!'
  };

  const FORMATTED_USER_LOG_ENTRY = {
    description: `${capitalize(USER_LOG_ENTRY.username)} ${USER_LOG_ENTRY.description.toLowerCase()}`
  };

  const USER_LOG_ENTRIES = [
    USER_LOG_ENTRY,
    USER_LOG_ENTRY,
    USER_LOG_ENTRY,
    USER_LOG_ENTRY,
    USER_LOG_ENTRY
  ];

  let changePasswordController;
  let activityController;

  transactionScope();
  beforeEach(() => auth.attempt(ADMIN_USER.username, ADMIN_USER.password));
  beforeEach(() => UserLog.bulkCreate(USER_LOG_ENTRIES, {transaction: transaction}));
  beforeEach(ngModule('activity-logs'));
  beforeEach(ngModule('change-password'));

  beforeEach(inject($componentController =>
  {
    activityController = $componentController('activityLogs');
    changePasswordController = $componentController('changePassword');
  }));

  it('should retrieve initial list from the database in order', function ()
  {
    return activityController.load({transaction: transaction}).then(activities =>
    {
      expect(activityController.activities.length).to.be.equal(5);
      for (let activity of activityController.activities)
        expect(activity).to.deep.include(FORMATTED_USER_LOG_ENTRY);
      expect(activityController.activities[4]._id + 1).to.equal(activityController.activities[3]._id);
      expect(activityController.activities[4]._id + 2).to.equal(activityController.activities[2]._id);
      expect(activityController.activities[4]._id + 3).to.equal(activityController.activities[1]._id);
      expect(activityController.activities[4]._id + 4).to.equal(activityController.activities[0]._id);
    })
  });

  it("should limit the loading of the initial list", function ()
  {
    return activityController.load({transaction: transaction, limit: 2}).then(activities =>
    {
      expect(activityController.activities.length).to.be.equal(2);
      for (let activity of activityController.activities)
        expect(activity).to.deep.include(FORMATTED_USER_LOG_ENTRY);
      expect(activityController.activities[1]._id + 1).to.equal(activityController.activities[0]._id);
    })
  });

  it("should be able to load older logs if available", function ()
  {
    return activityController.load({transaction: transaction, limit: 1}).then(activities =>
    {
      return activityController.load({transaction: transaction, limit: 1}).then(activities =>
      {
        return activityController.load({transaction: transaction, limit: 2}).then(activities =>
        {
          return activityController.load({transaction: transaction, limit: 1}).then(activities =>
          {
            expect(activityController.activities.length).to.equal(5);
            expect(activityController.activities[4]._id + 1).to.equal(activityController.activities[3]._id);
            expect(activityController.activities[4]._id + 2).to.equal(activityController.activities[2]._id);
            expect(activityController.activities[4]._id + 3).to.equal(activityController.activities[1]._id);
            expect(activityController.activities[4]._id + 4).to.equal(activityController.activities[0]._id);
          });
        });
      });
    });
  });

  it("should be able to pull newer logs every given refresh rate", function ()
  {
    return activityController.load({transaction: transaction})
      .then(activities => UserLog.bulkCreate(USER_LOG_ENTRIES, {transaction: transaction}))
      .then(activities =>
      {
        activityController.onNotifyTimer.then(() => {
          expect(activityController.activities.length).to.equal(10);
          expect(activityController.activities[9]._id + 1).to.equal(activityController.activities[8]._id);
          expect(activityController.activities[9]._id + 2).to.equal(activityController.activities[7]._id);
          expect(activityController.activities[9]._id + 3).to.equal(activityController.activities[6]._id);
          expect(activityController.activities[9]._id + 4).to.equal(activityController.activities[5]._id);
          expect(activityController.activities[9]._id + 5).to.equal(activityController.activities[4]._id);
          expect(activityController.activities[9]._id + 6).to.equal(activityController.activities[3]._id);
          expect(activityController.activities[9]._id + 7).to.equal(activityController.activities[2]._id);
          expect(activityController.activities[9]._id + 8).to.equal(activityController.activities[1]._id);
          expect(activityController.activities[9]._id + 9).to.equal(activityController.activities[0]._id);
        });
      });
  });

  it("should be able to fill absent newer logs every notifier event", function ()
  {
    return activityController.load({transaction: transaction})
      .then(activities => UserLog.bulkCreate(USER_LOG_ENTRIES, {transaction: transaction}))
      .then(() => {
        changePasswordController.new_password = "hello";
        return changePasswordController.save({transaction: transaction});
      })
      .then(() =>
      {
        activityController.onNotifyUserAction.then(() => {
          expect(activityController.activities.length).to.equal(11);
          expect(activityController.activities[10]._id + 1).to.equal(activityController.activities[9]._id);
          expect(activityController.activities[10]._id + 2).to.equal(activityController.activities[8]._id);
          expect(activityController.activities[10]._id + 3).to.equal(activityController.activities[7]._id);
          expect(activityController.activities[10]._id + 4).to.equal(activityController.activities[6]._id);
          expect(activityController.activities[10]._id + 5).to.equal(activityController.activities[5]._id);
          expect(activityController.activities[10]._id + 6).to.equal(activityController.activities[4]._id);
          expect(activityController.activities[10]._id + 7).to.equal(activityController.activities[3]._id);
          expect(activityController.activities[10]._id + 8).to.equal(activityController.activities[2]._id);
          expect(activityController.activities[10]._id + 9).to.equal(activityController.activities[1]._id);
          expect(activityController.activities[10]._id + 10).to.equal(activityController.activities[0]._id);
        });
      });
  });

  it("should not contain a null when pulling updates in an empty list", function() {
    return activityController.pullUpdates({transaction: transaction})
      .then(() =>
      {
        expect(activityController.activities).to.not.contain(null);
      });
  });
});