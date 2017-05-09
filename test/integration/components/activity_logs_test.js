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

  let changePasswordController;
  let activityController;

  transactionScope();
  beforeEach(() => auth.attempt(ADMIN_USER.username, ADMIN_USER.password));
  beforeEach(ngModule('activity-logs'));
  beforeEach(ngModule('change-password'));

  beforeEach(inject($componentController => {
    activityController = $componentController('activityLogs');
    changePasswordController = $componentController('changePassword');
  }));

  it('should update the messages of a successful change password', function ()
  {
    changePasswordController.new_password = "hello";
    return changePasswordController.save({transaction: transaction}).then(message => {
      expect(activityController.messages.pop()).to.deep.equal({
        date: moment(message.created_at).format("MMMM Do YYYY, hh:mm:ss a"),
        description: `${capitalize(ADMIN_USER.username)} ${message.description.toLowerCase()}`
      });
    });
  });
});