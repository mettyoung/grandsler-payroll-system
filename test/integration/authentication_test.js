/**
 * Test Helpers
 */
const {expect} = require('chai');
const {User} = require('../../app/models/index');
const transactionScope = require('../transaction_scope');

/**
 * System Under Test
 */
const auth = require('../../app/models/domain/authentication');

/**
 * Specs
 */
describe('Authentication Module', () => {

  const username = "dummy";
  const password = "dummy";

  transactionScope();

  beforeEach(() => {
    return User.create({id: 100, username: "dummy", password: "dummy", updated_by: 100}, {transaction: transaction});
  });

  afterEach(() => {
    auth.user = null;
  });

  it("should authenticate user against the database", () =>
  {
    return auth.attempt(username, password, {transaction: transaction}).then(user => {
      expect(user).to.deep.include({
        id: 100,
        username: "dummy",
        password: "dummy",
        updated_by: 100
      });
    });
  });

  it("should not authenticate the user if username and password do not match any user entries against the database", done => {
    auth.attempt(username, "wrong-password", {transaction: transaction}).catch(() =>
      auth.attempt("wrong-username", password, {transaction: transaction}).catch(() =>
        auth.attempt("wrong-username", "wrong-password", {transaction: transaction}).catch(() => done())
      )
    );
  });

  it("should store the authenticated user in the singleton authentication instance", () =>
  {
    expect(auth.user).to.equal(null);
    return auth.attempt(username, password, {transaction: transaction}).then(user => {
      expect(auth.user).to.deep.include({
        id: 100,
        username: "dummy",
        password: "dummy",
        updated_by: 100
      });
    });
  });

  it("should not authenticate user if is_enabled is set to 0", done => {
    User.findOne({where: {id: 100}, transaction: transaction}).then(user => {
      user.is_enabled = false;
      user.save({transaction: transaction}).then(() =>
      {
        auth.attempt(username, password, {transaction: transaction}).catch(() => {
          done();
        });
      });
    });
  });

  it("should not authenticate user if employee is not active regardless of is_enabled flag");
});