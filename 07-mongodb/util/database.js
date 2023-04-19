const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect("localhost:27017")
    .then((client) => {
      console.log("Connected!");
      _db = client.db("test"); //will be created on the fly.
      callback(client);
    })
    .catch((err) => {
      console.log(err);
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No Database Found";
};
exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
