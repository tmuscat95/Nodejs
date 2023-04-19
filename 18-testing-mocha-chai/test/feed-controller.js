const expect = require("chai").expect;
const sinon = require("sinon");

const User = require("../models/user");
const Post = require("../models/post");

const FeedController = require("../controllers/feed");
const mongoose = require("mongoose");
//Testing async code
describe("Feed Controller", function () {
  before(function (done) {
    //Runs once before any tests
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

  beforeEach(function () {
    //before each test case
  });

  afterEach(function () {
    //after each test case
  });

  after(function (done) {
    //Runs when all tests have executed.
    //Cleanup
    User.deleteMany({}).then(() => {
      mongoose.disconnect().then(() => {
        done(); //
      });
    });
  });

  it("Should add a created post to the posts of the creator.", function (done) {
    //sinon.stub(User, "findOne");
    //User.findOne.throw();

    const req = {
      body: {
        email: "test@test.com",
        password: "tester",
      },
      file: {
        path: "abc",
      },
      userId: "xyz",
    };

    const res = {
      status: () => {
        return this;
      },
      json: () => {},
    };
    FeedController.createPost(req, res, () => {}).then((savedUser) => {
      expect(savedUser).to.have.property("posts");
      expect(savedUser.posts).to.have.length(1);
      done();
    });

    //User.findOne.restore();
  });
});
