const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middleware/auth");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
    /**GraphQL middleware rejects any requests that are not POST.
     * This way initial request with OPTIONS method from frontend app will
     * receive a valid response without ever reaching the graphql middleware.
     */
  }
  next();
});

/**When using GraphQL, best just to use REST for file upload. */
app.put("/post-image", (req, res, next) => {
  if(!req.isAuth){
    throw new Error("Not authenticated.");
  }
  if (!req.file) {
    return res.status(200).json({ message: "No File." });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ message: "File Stored", filePath: req.file.path });
});

app.use(auth);
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true, // /graphql will get you a graphical console
    formatError(err) {
      /**err is of type GraphQL Error; this function will catch any error thrown in the application
       * and create a new GraphQLError object. the originalError is the original JS Error object thrown.
       */
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "Error";
      const status = err.originalError.statusCode;

      return { data, message, status };
    },
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    "mongodb+srv://maximilian:9u4biljMQc4jjqbe@cluster0-ntrwp.mongodb.net/messages?retryWrites=true"
  )
  .then((result) => {
    const server = app.listen(8080);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => console.log(err));
