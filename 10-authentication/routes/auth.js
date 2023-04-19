const express = require("express");
const {
  check,
  body,
  param,
  cookie,
  header,
} = require("express-validator/check");
/**
 * check will look for the passed variable name everywhere in the whole request,
 * alternatively, there are body, param, cookie ....etc that will look for it in specific parts
 * of the request.
 */
const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post(
  "/login",
  body("email").isEmail().withMessage("Please Enter A Valid Email Address"),
  body("password", "Password has to be valid")
    .isLength({ min: 5 })
    .isAlphanumeric(),
  authController.postLogin
);

router.post("/signup", authController.postSignup);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset/:token", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

router.post(
  "/signup",
  check("email")
    .isEmail()
    .withMessage("Enter a valid email")
    .custom((value, { req }) => {
      //custom validator
      //if (value === "test@test.com") {
      //  throw new Error("test error message");
      //}
      return User.findOne({ email: email }).then((userDoc) => {
        /**Async Validation.
         * If promise completes successfully, will be treated as if function
         * returned true.
         * If Promise is rejected; ie throws an error; is same as if error was thrown
         * with
         */
        if (userDoc) {
          throw Promise.reject("Email exists.");
        }
        //return true;
      });
    })
    .normalizeEmail() //remove uppercase letters etc.
    .trim(),
  body(
    "password",
    "Please Enter a password >=5 characters with only alphanumberic characters"
  )
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords must match.");
      }
      return true;
    })
    .trim(),
  authController.postSignup
);
/**Will look for "email" in the request body, headers, get parameters etc
 * and apply a check to it.
 * and then adds any errors to the request passed to the next middleware in the pipeline
 * Can chain validators.
   errors can be retrieved in subsequent middlewares by calling validationResult(req) 
   validationResult being a function from the express-validator/check subpackage. 
   Errors are represented as an array; with messages added through withMessage being stored in a msg property on the object.
    withMessage should be called after every chained validator; in order to pass the message for that particular error.
    
    Alternatively, one can pass a string as a second argument to check (or body, param etc..) that
    will be the default error message for all the validators.
   */
module.exports = router;
