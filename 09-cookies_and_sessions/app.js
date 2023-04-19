const path = require("path");

//Express
const express = require("express");

//Routes
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const mongoDBURL = "localhost:27017";
const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();

//Session Management
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const store = new MongoDBStore({
  url: mongoDBURL,
  collection: "sessions",
});

/*Adds session object to req; 
arbitrary values cann be added to this object in the request pipeline; (see auth.js)
These values are scope to the current user session, and are by default stored in memory,
or in a store if we specify one as below.
This req.session is object is automatically populated for a valid session by the middleware with the
stored values for that session.
*/
app.use(
  session({
    secret: "secret_value",
    resave: false,
    saveUninitialized: false,
    store: store,
    /*cookie: {
      COOKIE OPTIONS; SEE DOCS
    }*/
  })
);
app.use((req, res, next) => {
  /**The purpose of this middleware is that while a User object is stored in the session data,
   * and is retrieved by the session middleware for a valid session,
   * the retrieved req.session.user object does not contain the Mongoose methods.
   * In this middleware, we take the req.session.user object, and set req.user to a mongoose object
   * by retrieving it from mongoose by the _id in req.session.user. 
   */
  if(!req.session.user){
    next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});
/**
 * MongoDBStore:
 * By setting the store key in the object passed to the session to our created
 * MongoDBStore object, session data (that is, data set on req.session) is persisted
 * automatically to the collection/mongoDB database we specified when creating the store object above.
 */
app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

//secret : secret used as parameter to HMAC function to sign cookie value
//resave: only modifies cookie if session was modified.
/**
 * https://dev.to/saurabh2412/cookies-or-jwt-o2i
 * Cookie-Based Sessions General:
 * 1. User posts credentials
 * 2. Server checks credentials; if valid, generates a session id, hashes it using the secret and sets in the browser's cookie store
 * 3. typically, this session Id is stored in a DB somewhere; but can also be stored in memory. (not practical for prod ofc)
 * 4. Browser forwards this session ID + the hash to the server; server checks if session ID is valid, by checking if its present in the database and grants or denies access
 */
app.use((req, res, next) => {
  User.findById("5bab316ce0a7c75f783cb8a8")
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(mongoDBURL)
  .then((result) => {
    User.findOne().then((user) => {
      if (!user) {
        const user = new User({
          name: "Max",
          email: "max@test.com",
          cart: {
            items: [],
          },
        });
        user.save();
      }
    });
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
