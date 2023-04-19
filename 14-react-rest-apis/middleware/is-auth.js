const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.get("Authorization").split(" ")[1]; //Authorization: Bearer tokenbase64string
  let decodedToken;
  try {
    decodedToken = jwt.verify(token,"secret");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("Token Invalid");
    error.statusCode = 401;
    throw error;
  }

  req.userId = decodedToken.userId;
  next();
};
