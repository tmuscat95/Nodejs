const User = require("../models/user");
const { body } = require("express-validator/check");
const { validationResult } = require("express-validator/check");

exports.signUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({ email, name, password: hashedPw });
      return user.save();
    })
    .then((res) =>
      res.status(200).json({ userId: res._id, message: "User Created" })
    )
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("A User with this email could not be found");
        error.statusCode = 404;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        { email: loadedUser, userId: loadedUser._id.toString() },
        "secret",
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({token:token,userId:loadedUser._id.toString()})
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};
