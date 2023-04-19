const mongoConnect = require("../util/database");
const getDb = require("../util/database").getDb;
const mongodb = require("mongodb");

class Product {
  constructor(title, price, imageUrl, description, id, userId) {
    this.title = title;
    this.price = price;
    this.imageUrl = imageUrl;
    this.description = description;
    this._id = id ? new mongodb.ObjectId(id) : null;
    this.userId = userId;
  }

  save() {
    const db = getDb();
    let dbOp;
    if (!this._id) dbOp = db.collection("products").insertOne(this);
    else {
      dbOp = db
        .collection("products")
        .updateOne({ _id: this._id }, { $set: this });
    }
    dbOp
      .this((result) => {
        console.log(result);
      })
      .catch((err) => console.log(err));
  }

  static fetchAll() {
    const db = getDb();

    const cursor = db.collection("products").find(); //gets cursor; not all the documents at once. Pagination.
    return cursor.toArray();
  }

  static findById(prodId) {
    const db = getDb();
    const cursor = db
      .collection("products")
      .find({ _id: new mongodb.ObjectId(prodId) });
    return cursor
      .next()
      .then((product) => {
        console.log(product);
        return product;
      })
      .catch((err) => console.log(err));
  }

  static deleteById(prodId) {
    const db = getDb();
    db.collection("products")
      .deleteOne({ _id: new mongodb.ObjectId(prodId) })
      .then(() => console.log("deleted"))
      .catch((err) => console.log(err));
  }
}

module.exports = Product;
