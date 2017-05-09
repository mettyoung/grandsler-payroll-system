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
  const MOCK_MD_TOAST = {
    show() {
      this.isShowCalled = true;
      return this;
    },
    simple() {
      return this;
    },
    textContent(content) {
      this.content = content;
      return this;
    },
    action() {
      return this;
    },
    highlightAction() {
      return this;
    },
    hideDelay() {
      return this;
    }
  };

  const auth = require('../../../app/models/domain/authentication');
  transactionScope();

  beforeEach(() => auth.attempt(ADMIN_USER.username, ADMIN_USER.password));
  beforeEach(ngModule('notifier'));
  beforeEach(ngModule($provide => {$provide.value('$mdToast', MOCK_MD_TOAST); return null; }));
  beforeEach(inject((_Notifier_) => {
    Notifier = _Notifier_;
    MOCK_MD_TOAST.isShowCalled = false;
    MOCK_MD_TOAST.content = null;
  }));

  it("should return the message object as a promise", function () {
    return Notifier.perform(CONTROLLER.save, {transaction: transaction}).should.eventually.deep.include(EXPECTED_MESSAGE);
  });

  it("should save the EXPECTED_MESSAGE to user_log", function () {
    return Notifier.perform(CONTROLLER.save, {transaction: transaction}).then(message => {
      return UserLog.findOne({
        where: EXPECTED_MESSAGE,
        transaction: transaction
      }).should.eventually.deep.include(EXPECTED_MESSAGE);
    });
  });

  it("should pass the new message from the user_logs to the succeeding chains after a successful operation", function() {
    return Notifier.perform(CONTROLLER.save, {transaction: transaction}).then(message => {
      return UserLog.findOne({
        where: EXPECTED_MESSAGE,
        transaction: transaction
      }).then(user => expect(user.get({plain: true})).to.deep.equal(message));
    });
  });

  it("should execute a toast containing a saved message", function(done) {

    expect(MOCK_MD_TOAST.isShowCalled).to.be.false;
    Notifier.perform(CONTROLLER.save, {transaction: transaction}).then(message => {
      expect(MOCK_MD_TOAST.isShowCalled).to.be.true;
      expect(MOCK_MD_TOAST.content).to.equal('Saved!');
      done();
    });
  });

  it("should be capable of adding listeners to be executed if operation is successful", function() {

    let isFirstListenerCalled = false;
    Notifier.addListener(message => {
      expect(message).to.deep.include(EXPECTED_MESSAGE);
      isFirstListenerCalled = true;
    });

    let isSecondListenerCalled = false;
    Notifier.addListener(message => {
      expect(message).to.deep.include(EXPECTED_MESSAGE);
      isSecondListenerCalled = true;
    });

    return Notifier.perform(CONTROLLER.save, {transaction: transaction}).then(message => {
      expect(isFirstListenerCalled).to.be.true;
      expect(isSecondListenerCalled).to.be.true;
    });
  });
});