/**
 * Test Helpers
 */
const {ngModule, inject} = require('../../helpers/angular_test_setup');
require('../../helpers/chai_with_promised');
const transactionScope = require('../../helpers/transaction_scope');
const {UserLog} = require('../../../app/models/persistence/index');

/**
 * System Under Test
 */
require('../../../app/services/notifier/notifier.module');
require('../../../app/services/notifier/notifier.service');

/**
 * Specs
 */
describe('Notifier Angular Service', function () {

  const ADMIN_USER = {
    id: 1,
    username: "admin",
    password: "admin"
  };

  const ORIGINAL_MESSAGE = {
    module: 'Change Password',
    description: 'Changed his/her password'
  };

  const EXPECTED_MESSAGE = Object.assign(ORIGINAL_MESSAGE, {
    user_id: ADMIN_USER.id
  });

  const CONTROLLER = {
    save: function () {
      return Promise.resolve(ORIGINAL_MESSAGE);
    }
  };

  let Notifier;

  const auth = require('../../../app/models/domain/authentication');
  transactionScope();

  beforeEach(() => auth.attempt(ADMIN_USER.username, ADMIN_USER.password));
  beforeEach(ngModule('notifier'));
  beforeEach(inject((_Notifier_) => {
    Notifier = _Notifier_;
  }));

  it("should return the message object as a promise", function () {
    return Notifier.register(CONTROLLER.save, {transaction: transaction})().should.eventually.deep.equal(EXPECTED_MESSAGE);
  });

  it("should save the EXPECTED_MESSAGE to user_log", function () {
    return Notifier.register(CONTROLLER.save, {transaction: transaction})().then(message => {
      return UserLog.findOne({
        where: EXPECTED_MESSAGE,
        transaction: transaction
      }).should.eventually.deep.include(EXPECTED_MESSAGE);
    });
  });
});