/**
 * Test Helpers
 */
require('../../../helpers/chai_with_promised');
const transactionScope = require('../../../helpers/transaction_scope');
const moment = require('moment');
const {User, Employee, Position, TimeShift, SALARY_CRITERION, Employment} = require('../../../../app/models/persistence/index');

/**
 * System Under Test
 */
const auth = require('../../../../app/models/domain/authentication');

/**
 * Specs
 */
describe('Authentication Module', () => {

  const ADMIN_USER = {
    id: 1,
    username: "admin",
    password: "admin",
    updated_by: 1
  };

  const DUMMY_POSITION = {
    id: 100,
    name: "dummy",
    created_by: ADMIN_USER.id,
    updated_by: ADMIN_USER.id
  };

  const DUMMY_SALARY_CRITERION = {
    id: 100,
    name: "Dummy Pay",
    mark_up: "0",
    updated_by: ADMIN_USER.id
  };

  const DUMMY_TIME_SHIFT = {
    id: 100,
    salary_criterion_id: 100,
    name: "Dummy Time-shift",
    created_by: ADMIN_USER.id,
    updated_by: ADMIN_USER.id
  };

  const DUMMY_EMPLOYEE = {
    id: 100,
    position_id: 100,
    time_shift_id: 100,
    user_id: ADMIN_USER.id,
    employee_type: 'Time-based',
    last_name: "world",
    first_name: "hello",
    gender: 'Male',
    created_by: ADMIN_USER.id,
    updated_by: ADMIN_USER.id
  };

  transactionScope();

  afterEach(() => {
    auth.user = null;
  });

  it("should authenticate user against the database", () => {
    return auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction})
      .should.eventually.deep.include(ADMIN_USER);
  });

  it("should not authenticate the user if username and password do not match any user entries against the database", done => {
    auth.attempt(ADMIN_USER.username, "wrong-password", {transaction: transaction}).catch(() =>
      auth.attempt("wrong-username", ADMIN_USER.password, {transaction: transaction}).catch(() =>
        auth.attempt("wrong-username", "wrong-password", {transaction: transaction}).catch(() => done())
      )
    );
  });

  it("should store the authenticated user in the singleton authentication instance", () => {
    expect(auth.user).to.equal(null);
    return auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction})
      .should.eventually.deep.include(ADMIN_USER);
  });

  it("should not authenticate user if is_enabled is set to 0", done => {
    User.findOne({where: {id: ADMIN_USER.id}, transaction: transaction}).then(user => {
      user.is_enabled = false;
      user.save({transaction: transaction}).then(() => {
        auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction}).catch(() => {
          done();
        });
      });
    });
  });

  it("should authenticate user if employee is hired with undefined release date and its user account is still active", () => {
    const DUMMY_EMPLOYMENT = {
      id: 100,
      employee_id: 100,
      date_hired: new Date(),
      date_released: null,
      created_by: ADMIN_USER.id,
      updated_by: ADMIN_USER.id
    };

    return Position.create(DUMMY_POSITION, {transaction: transaction})
      .then(position => SALARY_CRITERION.create(DUMMY_SALARY_CRITERION, {transaction: transaction}))
      .then(SALARY_CRITERION => TimeShift.create(DUMMY_TIME_SHIFT, {transaction: transaction}))
      .then(timeShift => Employee.create(DUMMY_EMPLOYEE, {transaction: transaction}))
      .then(employee => Employment.create(DUMMY_EMPLOYMENT, {transaction: transaction}))
      .then(() => auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction}))
      .should.eventually.deep.include(ADMIN_USER);
  });

  it("should authenticate user if employee is hired with defined release date and its user account is still active", () => {
    const DUMMY_EMPLOYMENT = {
      id: 100,
      employee_id: 100,
      date_hired: new Date(),
      date_released: moment().add(1, 'days').toDate(),
      created_by: ADMIN_USER.id,
      updated_by: ADMIN_USER.id
    };

    return Position.create(DUMMY_POSITION, {transaction: transaction})
      .then(position => SALARY_CRITERION.create(DUMMY_SALARY_CRITERION, {transaction: transaction}))
      .then(SALARY_CRITERION => TimeShift.create(DUMMY_TIME_SHIFT, {transaction: transaction}))
      .then(timeShift => Employee.create(DUMMY_EMPLOYEE, {transaction: transaction}))
      .then(employee => Employment.create(DUMMY_EMPLOYMENT, {transaction: transaction}))
      .then(() => auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction}))
      .should.eventually.deep.include(ADMIN_USER);
  });

  it("should not authenticate user if employee is not hired but its user account is still active", done => {
    const DUMMY_EMPLOYMENT = {
      id: 100,
      employee_id: 100,
      date_hired: moment().add(1, 'days').toDate(),
      date_released: null,
      created_by: ADMIN_USER.id,
      updated_by: ADMIN_USER.id
    };

    Position.create(DUMMY_POSITION, {transaction: transaction})
      .then(position => SALARY_CRITERION.create(DUMMY_SALARY_CRITERION, {transaction: transaction}))
      .then(SALARY_CRITERION => TimeShift.create(DUMMY_TIME_SHIFT, {transaction: transaction}))
      .then(timeShift => Employee.create(DUMMY_EMPLOYEE, {transaction: transaction}))
      .then(employee => Employment.create(DUMMY_EMPLOYMENT, {transaction: transaction}))
      .then(() => auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction}))
      .then(() => {
        auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction}).catch(() => {
          done();
        });
      });
  });

  it("should save the authenticated user in the created_by field whether present or not of any given model if authenticated", function () {

    const DUMMY_USER = {
      id: 100,
      username: "dummy",
      is_enabled: 1,
      password: "dummy"
    };

    const DUMMY_POSITION = {
      id: 100,
      name: "dummy"
    };

    return auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction}).then(() => {
      return Promise.all([
        User.create(DUMMY_USER, {transaction: transaction}).should.eventually.deep.include({
          'created_by': auth.user.id,
          'updated_by': auth.user.id
        }),
        Position.create(DUMMY_POSITION, {transaction: transaction}).should.eventually.deep.include({
          'created_by': auth.user.id,
          'updated_by': auth.user.id
        })
      ]);
    });
  });

  it("should save the authenticated user in the updated_by field of any given model if authenticated", function (done) {

    const DUMMY_USER = {
      id: 100,
      username: "dummy",
      is_enabled: 1,
      password: "dummy"
    };

    const DUMMY_POSITION = {
      id: 100,
      name: "dummy"
    };

    auth.attempt(ADMIN_USER.username, ADMIN_USER.password, {transaction: transaction}).then(user => {
      return Promise.all([
        User.create(DUMMY_USER, {transaction: transaction}),
        Position.create(DUMMY_POSITION, {transaction: transaction})
      ]).then(values => {

        // Modify models.
        const user = values[0];
        const position = values[1];
        user.username += "dummy";
        position.name += "dummy";

        // Change authenticated user.
        return auth.attempt(DUMMY_USER.username, DUMMY_USER.password, {transaction: transaction}).then(() => {
          // Save the changes.
          return Promise.all([
            user.save({transaction: transaction}),
            position.save({transaction: transaction})
          ]);
        });

      }).then(values => {
        expect(values[0]).to.deep.include({
          created_by: ADMIN_USER.id,
          updated_by: DUMMY_USER.id
        });
        expect(values[1]).to.deep.include({
          created_by: ADMIN_USER.id,
          updated_by: DUMMY_USER.id
        });
        done();
      });
    });
  });

  it("should not supply any authenticated user in the created_by or updated_by field if not authenticated", function () {

    const DUMMY_USER = {
      id: 100,
      username: "dummy",
      is_enabled: 1,
      password: "dummy"
    };

    const DUMMY_POSITION = {
      id: 100,
      name: "dummy"
    };

    return Promise.all([
      User.create(DUMMY_USER, {transaction: transaction}),
      Position.create(DUMMY_POSITION, {transaction: transaction})
    ]).should.be.rejected;
  });
});