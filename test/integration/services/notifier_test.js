/**
 * Test Helpers
 */
const {ngModule, inject} = require('../../helpers/angular_test_setup');
require('../../helpers/chai_with_promised');
const transactionScope = require('../../helpers/transaction_scope');
const {User, UserLog, Employee, UserPermission} = require('../../../app/models/persistence/index');
const moment = require('moment');
const auth = require('../../../app/models/domain/authentication');

/**
 * System Under Test
 */
require('../../../app/services/notifier/notifier.module');
require('../../../app/services/notifier/notifier.service');

/**
 * Specs
 */
describe('Notifier Angular Service', function ()
{

  const ADMIN_USER = {
    id: 1,
    username: "admin",
    password: "admin"
  };

  const ORIGINAL_MESSAGE = {
    module: 'Change Password',
    description: 'Changed his/her password'
  };

  const EXPECTED_USER_LOG = Object.assign({}, ORIGINAL_MESSAGE, {
    User: {
      id: ADMIN_USER.id,
      username: ADMIN_USER.username
    }
  });

  const CONTROLLER = {};

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

  transactionScope();

  beforeEach(() => auth.attempt(ADMIN_USER.username, ADMIN_USER.password));
  beforeEach(ngModule('notifier'));
  beforeEach(ngModule($provide =>
  {
    $provide.value('$mdToast', MOCK_MD_TOAST);
    return null;
  }));
  beforeEach(inject((_Notifier_) =>
  {
    Notifier = _Notifier_;
    MOCK_MD_TOAST.isShowCalled = false;
    MOCK_MD_TOAST.content = null;
  }));

  beforeEach(() =>
  {
    CONTROLLER.save = function ()
    {
      return Promise.resolve(ORIGINAL_MESSAGE);
    }
  });

  it("should transform the {Message} to its UserLog equivalent from the user_logs to the succeeding chains after a successful operation", function ()
  {
    return Notifier.perform(CONTROLLER.save, transaction).then(userLog =>
    {
      return UserLog.findOne({
        where: ORIGINAL_MESSAGE,
        include: [{
          model: User,
          include: [Employee, UserPermission]
        }],
        transaction: transaction
      }).then(newUserLog => expect(newUserLog.get({plain: true})).to.deep.equal(userLog));
    });
  });

  it("should save the {Message} to user_logs", function ()
  {
    return Notifier.perform(CONTROLLER.save, transaction).then(userLog =>
    {
      return UserLog.findOne({
        include: [User],
        where: ORIGINAL_MESSAGE,
        transaction: transaction
      }).then(userLog => assertUserLog(userLog.get({plain: true}), EXPECTED_USER_LOG));
    });
  });

  it("should include the User to the userLog", function ()
  {
    return Notifier.perform(CONTROLLER.save, transaction).then(userLog =>
    {
      expect(userLog.User.username).to.equal(ADMIN_USER.username);
    });
  });

  it("should display the configured toast message after a successful operation", function ()
  {
    CONTROLLER.save = () => Promise.resolve(Object.assign({toast: 'Hello World'}, ORIGINAL_MESSAGE));
    expect(MOCK_MD_TOAST.isShowCalled).to.be.false;
    return Notifier.perform(CONTROLLER.save, transaction).then(userLog =>
    {
      expect(MOCK_MD_TOAST.isShowCalled).to.be.true;
      expect(MOCK_MD_TOAST.content).to.equal('Hello World');
    });
  });

  it("should default to saved! toast message after a successful operation", function ()
  {
    expect(MOCK_MD_TOAST.isShowCalled).to.be.false;
    return Notifier.perform(CONTROLLER.save, transaction).then(userLog =>
    {
      expect(MOCK_MD_TOAST.isShowCalled).to.be.true;
      expect(MOCK_MD_TOAST.content).to.equal('Saved!');
    });
  });

  it("should be capable of adding listeners to be executed if operation is successful", function ()
  {
    let isFirstListenerCalled = false;
    Notifier.addListener(userLog =>
    {
      assertUserLog(userLog, EXPECTED_USER_LOG);
      isFirstListenerCalled = true;
    });

    let isSecondListenerCalled = false;
    Notifier.addListener(userLog =>
    {
      assertUserLog(userLog, EXPECTED_USER_LOG);
      isSecondListenerCalled = true;
    });

    return Notifier.perform(CONTROLLER.save, transaction).then(userLog =>
    {
      expect(isFirstListenerCalled).to.be.true;
      expect(isSecondListenerCalled).to.be.true;
    });
  });

  /**
   * Assertion helpers
   */
  function assertUserLog(actual, expected)
  {
    const expectedClone = Object.assign({}, expected);
    const actualClone = Object.assign({}, actual);

    // Assert the user part.
    expect(actualClone.User).to.deep.include(expectedClone.User);

    // Assert the userLog
    delete actualClone.User;
    delete expectedClone.User;
    expect(actualClone).to.deep.include(expectedClone);
  }
});