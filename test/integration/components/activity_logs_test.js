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
    date: moment(USER_LOG_ENTRY.created_at).format("MMMM Do YYYY, hh:mm:ss a"),
    description: `${capitalize(USER_LOG_ENTRY.username)} ${USER_LOG_ENTRY.description.toLowerCase()}`
  };

  const USER_LOG_ENTRIES = [
    USER_LOG_ENTRY,
    USER_LOG_ENTRY,
    USER_LOG_ENTRY,
    USER_LOG_ENTRY
  ];

  const FORMATTED_USER_LOG_ENTRIES = [
    FORMATTED_USER_LOG_ENTRY,
    FORMATTED_USER_LOG_ENTRY,
    FORMATTED_USER_LOG_ENTRY,
    FORMATTED_USER_LOG_ENTRY
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

  it('should update the activities of a successful change password', function ()
  {
    changePasswordController.new_password = "hello";
    return changePasswordController.save({transaction: transaction}).then(message =>
    {
      expect(activityController.activities.pop()).to.deep.equal(FORMATTED_USER_LOG_ENTRY);
    });
  });

  it('should retrieve initial list from the database', function ()
  {
    return activityController.load({transaction: transaction}).then(messages => {
      expect(activityController.activities).to.deep.equal(FORMATTED_USER_LOG_ENTRIES);
    })
  });
});