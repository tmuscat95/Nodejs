const express = require("express");
const bodyParser = require("body-parser");

const feedRoutes = require("./routes/feed");

const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); //Allows CORS requests from all domains.
  res.setHeader("Access-Control-Allow-Methods", "GET POST PUT PATCH DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); //client can have these headers
  next();
});
app.use("/feed", feedRoutes);

app.listen(8080);
