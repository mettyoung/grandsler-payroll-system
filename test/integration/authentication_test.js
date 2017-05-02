/**
 * Test Helpers
 */
const {expect} = require('chai');
const moment = require('moment');
const {User, Employee, Position, TimeShift, SALARY_CRITERION, Employment} = require('../../app/models/persistence/index');
const transactionScope = require('../transaction_scope');

/**
 * System Under Test
 */
const auth = require('../../app/models/domain/authentication');

/**
 * Specs
 */
describe('Authentication Module', () => {

  const ID = 100;
  const USERNAME = "dummy";
  const PASSWORD = "dummy";

  transactionScope();

  beforeEach(() => {
    return User.create({id: ID, username: USERNAME, is_enabled: 1, password: PASSWORD, updated_by: ID}, {transaction: transaction});
  });

  afterEach(() => {
    auth.user = null;
  });

  it("should authenticate user against the database", () =>
  {
    return auth.attempt(USERNAME, PASSWORD, {transaction: transaction}).then(user => {
      expect(user).to.deep.include({
        id: ID,
        username: USERNAME,
        password: PASSWORD,
        updated_by: ID
      });
    });
  });

  it("should not authenticate the user if username and password do not match any user entries against the database", done => {
    auth.attempt(USERNAME, "wrong-password", {transaction: transaction}).catch(() =>
      auth.attempt("wrong-username", PASSWORD, {transaction: transaction}).catch(() =>
        auth.attempt("wrong-username", "wrong-password", {transaction: transaction}).catch(() => done())
      )
    );
  });

  it("should store the authenticated user in the singleton authentication instance", () =>
  {
    expect(auth.user).to.equal(null);
    return auth.attempt(USERNAME, PASSWORD, {transaction: transaction}).then(user => {
      expect(auth.user).to.deep.include({
        id: ID,
        username: USERNAME,
        password: PASSWORD,
        updated_by: ID
      });
    });
  });

  it("should not authenticate user if is_enabled is set to 0", done => {
    User.findOne({where: {id: ID}, transaction: transaction}).then(user => {
      user.is_enabled = false;
      user.save({transaction: transaction}).then(() =>
      {
        auth.attempt(USERNAME, PASSWORD, {transaction: transaction}).catch(() => {
          done();
        });
      });
    });
  });

  it("should authenticate user if employee is hired with undefined release date and its user account is still active", done => {
    Position.create({id: ID, name: "Accountant", created_by: ID, updated_by: ID}, {transaction: transaction})
      .then(position => SALARY_CRITERION.create({id: ID, name: "Dummy Pay", mark_up: "0", updated_by: ID}, {transaction: transaction}))
      .then(SALARY_CRITERION => TimeShift.create({id: ID, salary_criterion_id: ID, name: "Dummy Time-shift", created_by: ID, updated_by: ID},
        {transaction: transaction}))
      .then(timeShift => Employee.create({id: ID, position_id: ID, time_shift_id: ID, user_id: ID, employee_type: 'Time-based',
          last_name: "world", first_name: "hello", gender: 'Male', created_by: ID, updated_by: ID},
        {transaction: transaction}))
      .then(employee => Employment.create({id: ID, employee_id: ID, date_hired: new Date(), date_released: null, created_by: ID,
        updated_by: ID}, {transaction: transaction}))
      .then(() =>
      {
        auth.attempt(USERNAME, PASSWORD, {transaction: transaction}).then(() => {
          done();
        });
      });
  });

  it("should authenticate user if employee is hired with defined release date and its user account is still active", done => {
    Position.create({id: ID, name: "Accountant", created_by: ID, updated_by: ID}, {transaction: transaction})
      .then(position => SALARY_CRITERION.create({id: ID, name: "Dummy Pay", mark_up: "0", updated_by: ID}, {transaction: transaction}))
      .then(SALARY_CRITERION => TimeShift.create({id: ID, salary_criterion_id: ID, name: "Dummy Time-shift", created_by: ID, updated_by: ID},
        {transaction: transaction}))
      .then(timeShift => Employee.create({id: ID, position_id: ID, time_shift_id: ID, user_id: ID, employee_type: 'Time-based',
          last_name: "world", first_name: "hello", gender: 'Male', created_by: ID, updated_by: ID},
        {transaction: transaction}))
      .then(employee => Employment.create({id: ID, employee_id: ID, date_hired: new Date(), date_released: moment().add(1, 'days').toDate(), created_by: ID,
        updated_by: ID}, {transaction: transaction}))
      .then(() =>
      {
        auth.attempt(USERNAME, PASSWORD, {transaction: transaction}).then(() => {
          done();
        });
      });
  });

  it("should not authenticate user if employee is not hired but its user account is still active", done => {
    Position.create({id: ID, name: "Accountant", created_by: ID, updated_by: ID}, {transaction: transaction})
      .then(position => SALARY_CRITERION.create({id: ID, name: "Dummy Pay", mark_up: "0", updated_by: ID}, {transaction: transaction}))
      .then(SALARY_CRITERION => TimeShift.create({id: ID, salary_criterion_id: ID, name: "Dummy Time-shift", created_by: ID, updated_by: ID},
        {transaction: transaction}))
      .then(timeShift => Employee.create({id: ID, position_id: ID, time_shift_id: ID, user_id: ID, employee_type: 'Time-based',
          last_name: "world", first_name: "hello", gender: 'Male', created_by: ID, updated_by: ID},
        {transaction: transaction}))
      .then(employee => Employment.create({id: ID, employee_id: ID, date_hired: moment().add(1, 'days').toDate(), date_released: null, created_by: ID,
        updated_by: ID}, {transaction: transaction}))
      .then(() =>
      {
        auth.attempt(USERNAME, PASSWORD, {transaction: transaction}).catch(() => {
          done();
        });
      });
  });
});