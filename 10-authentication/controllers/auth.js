const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator/check");
const crypto = require("crypto");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: "SENG_GRID_API_KEY_HERE",
    },
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash("error"); //returns an array
  //key is removed from flash store after being read.
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,

    //isAuthenticated: false,
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    //isAuthenticated: false,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid Email Or Password."); //adds a temporary value to the flash store; accessible in subsequent middlewares via req.flash("error");
        return res.render("/login");
      }
      bcrypt //hashes first argument and compares to hash (2nd argument).
        .compare(email, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          } else return res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error["httpStatusCode"] = 500;
      return next(error); //When next is called with an error object passed as argument,express skips all middlewares until it finds and error handling middleware.
      //An error handling middleware is one with a signature (error, res,res,next)=>
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
    }); //402: validation failed.
  }

  User.findOne({ email: email }).then((userDoc) => {
    if (userDoc) {
      return res.redirect("/signup");
    }
    return bcrypt
      .hash(password, 12)
      .then((hashedPassword) => {
        const user = new User({
          email: email,
          password: hashedPassword,
          cart: { items: [] },
        });
        return user.save();
      })
      .then((result) => {
        transporter.sendMail({
          to: email,
          from: "shop@node-complete.com",
          subject: "Signup succeeded!",
          html: "<h1>You successfully signed up!</h1>",
        });
        return res.redirect("/login");
      })
      .catch((err) => {
        const error = new Error(err);
        error["httpStatusCode"] = 500;
        return next(error); //When next is called with an error object passed as argument,express skips all middlewares until it finds and error handling middleware.
        //An error handling middleware is one with a signature (error, res,res,next)=>
      });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Password Reset",
    //isAuthenticated: false,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }

    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No Account Found With that Email");
          res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now();
        return user.save();
      })
      .then((result) => {
        transporter.sendMail({
          to: email,
          from: "shop@node-complete.com",
          subject: "Password Reset",
          html: `<h1>Password Reset.</h1>
          <p>Requested Password Reset. Click here: <a href="http://localhost:3000/reset/${token}">Reset Password</a></p>`,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error["httpStatusCode"] = 500;
        return next(error); //When next is called with an error object passed as argument,express skips all middlewares until it finds and error handling middleware.
        //An error handling middleware is one with a signature (error, res,res,next)=>
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let message = req.flash("error"); //returns an array
      //key is removed from flash store after being read.
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      res.render("/auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token /**token is passed to the post new password
        route from the form where it is rendered as the value in a hidden input field. */,
      });
    })
    .catch((err) => console.log(err));
  let message = req.flash("error"); //returns an array
  //key is removed from flash store after being read.
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/new-password", {
    path: "/new-password",
    pageTitle: "Password Reset",
  });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error["httpStatusCode"] = 500;
      return next(error); //When next is called with an error object passed as argument,express skips all middlewares until it finds and error handling middleware.
      //An error handling middleware is one with a signature (error, res,res,next)=>
    });
};
