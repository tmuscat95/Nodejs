exports.getLogin = (req, res, next) => {
  console.log(req.session.isLoggedIn);
  const isLoggedIn =
    req.get("Cookie").split(";")[1].trim().split("=")[1].trim() == "true";

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: isLoggedIn,
  });
};

exports.postLogin = (req, res, next) => {
  User.findById("5bab316ce0a7c75f783cb8a8")
    .then((user) => {
      req.session.isLoggedIn = true; //sets session cookie ONLY for this user.
      req.session.user = user; //persisted to store; survives across requests.
      req.session.save((err) => {
        /*calling res.render inside a callback passed to the save function,
          ensures that the session data has been persisted to the store before exiting the middleware.
        */
        console.log(err);
        res.redirect("/");
      });
    })
    .catch((err) => console.log(err));
  //res.setHeader("Set-Cookie", "loggedIn=true; Max-Age=10; Secure");

  //Secure; only serve via HTTPS
  //Max-Age expiry time in seconds
  //HttpOnly client-side code cannot read cookie values.
  res.redirect("/");
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    //deletes session and all session data in store or memory; does not delete session cookie in browser (but it is now invalid so this does not matter)
    console.log(err);
    res.redirect("/");
  });
};

/**
 * https://dev.to/saurabh2412/cookies-or-jwt-o2i
 * Cookie-Based Sessions General:
 * 1. User posts credentials
 * 2. Server checks credentials; if valid, generates a session id, hashes it using the secret and sets in the browser's cookie store
 * 3. typically, this session Id is stored in a DB somewhere; but can also be stored in memory. (not practical for prod ofc)
 * 4. Browser forwards this session ID + the hash to the server; server checks if session ID is valid, by checking if its present in the database and grants or denies access
 */
