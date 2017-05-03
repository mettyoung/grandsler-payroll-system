/**
 * Test Helpers
 */
const {ngModule, inject} = require('../../helpers/angular_test_setup');
const {expect} = require('chai');

/**
 * System Under Test
 */
require('../../../app/services/loader.module');
require('../../../app/services/loader.service');

/**
 * Specs
 */
describe('Loader Angular Service', function(){

  let loader;
  beforeEach(ngModule('loader'));
  beforeEach(inject((_Loader_) => {
    loader = _Loader_;
  }));

  it('should be able to disable and replace the innerHTML of the target temporarily with a loading icon ' +
    'until the asynchronous operation is finished successfully', function(done){
    const ORIGINAL_TEXT = "Foo and Bar";
    const target = {innerHTML: ORIGINAL_TEXT};
    loader.perform(target, function()
    {
      return new Promise((resolve, reject) => setTimeout(function() {
        resolve();
      }, 500));
    }).then(() => {
      expect(target.innerHTML).to.be.equal(ORIGINAL_TEXT);
      expect(target.disabled).to.be.false;
      done();
    });
    expect(target.innerHTML).to.be.equal(loader.LOADING_TEMPLATE);
    expect(target.disabled).to.be.true;
  });

  it('should be able to disable and replace the innerHTML of the target temporarily with a loading icon ' +
    'until the asynchronous operation is finished in failure', function(done){
    const ORIGINAL_TEXT = "Foo and Bar";
    const target = {innerHTML: ORIGINAL_TEXT};
    loader.perform(target, function()
    {
      return new Promise((resolve, reject) => setTimeout(function() {
        reject();
      }, 500));
    }).catch(() => {
      expect(target.innerHTML).to.be.equal(ORIGINAL_TEXT);
      expect(target.disabled).to.be.false;
      done();
    });
    expect(target.innerHTML).to.be.equal(loader.LOADING_TEMPLATE);
    expect(target.disabled).to.be.true;
  });
});