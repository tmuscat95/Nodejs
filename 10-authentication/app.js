const path = require("path");
const csrf = require("csurf");
const flash = require("connect-flash");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI = "localhost:27017";

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

const csrfProtection = csrf();
app.use(csrfProtection); //will look for a csrf token in the request body, throw an error otherwise.
//Adds a csrfToken() function to req.
//must then be added as a parameter to res.render (csrfToken: req.csrfToken()) (OR better, see below)
//And then passed as the value of a hidden input field with every form submission
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
  /*setting the csrfToken as variable inside "locals" in the response; 
    this way the csrfToken variable is accessible in every rendered page without having to pass it manually
    in every res.render function.
  */
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get("/500",errorController.get500);
app.use(errorController.get404);

app.use((error,req,res,next)=>{
  res.redirect("/500");
  //error handling middleware.
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
