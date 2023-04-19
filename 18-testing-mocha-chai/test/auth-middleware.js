const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../middleware/is-auth');

describe('Auth middleware', function() {
  it('should throw an error if no authorization header is present', function() {
    const req = {
      get: function(headerName) {
        return null;
      }
    };
    
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw(
      'Not authenticated.'
    );
  });

  it('should throw an error if the authorization header is only one string', function() {
    const req = {
      get: function(headerName) {
        return 'xyz';
      }
    };
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it('should yield a userId after decoding the token', function() {
    const req = {
      get: function(headerName) {
        return 'Bearer djfkalsdjfaslfjdlas';
      }
    };
    sinon.stub(jwt, 'verify'); //first param: the object, second param: the function name
    jwt.verify.returns({ userId: 'abc' }); //defines what the stub method actually returns
    /**Stub Functions:
     * Creates a mockup of the jwt.verify function;
     * this is will be run by the authMiddlewareFunction instead of the real one, since the way mocha works
     * the jwt.verify function defined by sinon here will override the real one in scope.
     * Don't actually need sinon to do this; will override it even if you define the stub manually
     */
    authMiddleware(req, {}, () => {});
    expect(req).to.have.property('userId');
    expect(req).to.have.property('userId', 'abc');
    expect(jwt.verify.called).to.be.true; //function was called
    jwt.verify.restore(); //replaces the function with the original overriden function in scope. 
  });

  it('should throw an error if the token cannot be verified', function() {
    const req = {
      get: function(headerName) {
        return 'Bearer xyz';
      }
    };
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });
});
