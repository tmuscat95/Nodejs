const expect = require("chai").expect;
const sinon = require("sinon");

const User = require("../models/user");
const AuthController = require("../controllers/auth");
const mongoose = require("mongoose");
//Testing async code
describe("Auth Controller", function () {
  before(function (done) { //Runs once before any tests
    mongoose
      .connect(
        "mongodb+srv://maximilian:9u4biljMQc4jjqbe@cluster0-ntrwp.mongodb.net/test_messages?retryWrites=true"
      )
      .then((result) => {
        //app.listen(8080);
        const user = new User({
          email: "test@test.com",
          password: "tester",
          name: "Test",
          posts: [],
          _id: "5c0f66b979af55031b34728a", //must be a valid MongoDB user id.
        });
        return user.save();
      })
      .then(() => {
        done();
      });
  });

  beforeEach(function(){
    //before each test case 
  });

  afterEach(function(){
    //after each test case
  });

  after(function(done){ //Runs when all tests have executed.
     //Cleanup
     User.deleteMany({}).then(() => {
        mongoose.disconnect().then(() => {
          done(); //
        });
      });
  });

  it("Should throw an error code 500 if accessing the db fails", function (done) {
    sinon.stub(User, "findOne");
    User.findOne.throw();

    const req = {
      body: {
        email: "test@test.com",
        password: "tester",
      },
    };
    AuthController.login(req, {}, () => {}).then((result) => {
      console.log(result);
      expect(result).to.be.an("error");
      /**NOTE: login function must be altered to return err
       * after passing it to next.
       */
      expect(result).to.have.property("statuscode", 500);
      done(); //Tells mocha to wait for async function calls to return before evaluating tests.
    });

    User.findOne.restore();
  });

  it("Should send a response with a valid usrr status for an existing user", function () {
    const req = {
      userId: "5c0f66b979af55031b34728a",
    };
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.userStatus = data.status;
      },
    };
    AuthController.getUserStatus(req, res, () => {}).then(() => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.userStatus).to.be.equal("I am new!");
     
    });
  });
});
